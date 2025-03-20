import React, { useEffect, useState } from "react";
import { auth, db } from "../FireBase/FireBase";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  Box,
  Text,
  Flex,
  Image,
  VStack,
  CircularProgress,
  CircularProgressLabel,
  Spacer,
  Button
} from "@chakra-ui/react";
import PersonalInfo from "./PersonalInfo";

const Badges = ({ userData }) => {
  const [badges, setBadges] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  // Assume the user document stores points along with other stats.
  const [userStats, setUserStats] = useState({ streak: 0, caloriesBurned: 0, points: 0 });
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  // 'step' indicates which view is active:
  // true = progress view, false = personal info view.
  const [step, setStep] = useState(true);

  // Corrected URL keys for badge mapping.
  const badgeMapping = {
    "https://tejaskasture.github.io/pose-classification-model/1_final.webp": "First Milestone",
    "https://tejaskasture.github.io/pose-classification-model/2_final.webp": "Second Milestone",
    "https://tejaskasture.github.io/pose-classification-model/3_final.webp": "Third Milestone"
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const userRef = doc(db, "users", userId);
    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBadges(data.badges || []);
          // Retrieve points along with other stats (adjust field names as needed)
          setUserStats({
            streak: data.currentStreak || 0,
            caloriesBurned: data.caloriesBurned || 0,
            points: data.points || 0,
          });
        }
      },
      (error) => {
        console.error("Error fetching badges:", error);
      }
    );
    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return <Text textAlign="center" mt={8}>Loading...</Text>;
  }

  // Reorder badges so that the third milestone appears in the middle if it exists.
  const thirdMilestoneUrl = "https://tejaskasture.github.io/pose-classification-model/3_final.webp";
  let orderedBadges = [...badges];
  const indexThird = orderedBadges.indexOf(thirdMilestoneUrl);
  if (indexThird !== -1 && orderedBadges.length >= 3) {
    orderedBadges.splice(indexThird, 1);
    const middleIndex = Math.floor(orderedBadges.length / 2);
    orderedBadges.splice(middleIndex, 0, thirdMilestoneUrl);
  }

  // Define milestone requirements for each badge based on points.
  const milestones = [
    {
      badgeUrl: "https://tejaskasture.github.io/pose-classification-model/1_final.webp",
      name: "First Milestone",
      description: "Reach 30 points",
      threshold: 30,
      current: userStats.points,
    },
    {
      badgeUrl: "https://tejaskasture.github.io/pose-classification-model/2_final.webp",
      name: "Second Milestone",
      description: "Reach 50 points",
      threshold: 50,
      current: userStats.points,
    },
    {
      badgeUrl: "https://tejaskasture.github.io/pose-classification-model/3_final.webp",
      name: "Third Milestone",
      description: "Reach 70 points",
      threshold: 70,
      current: userStats.points,
    },
  ];

  // Only show progress for milestones that have not been achieved.
  const pendingMilestones = milestones.filter(m => m.current < m.threshold);

  return (
    <Box mx="auto" p={6} pl={0} pr={0} textAlign="center">
      <Text fontSize="4xl" fontWeight="bold">{badges.length}</Text>
      <Text fontSize="md" color="gray.500" mb={10}>Badges Unlocked</Text>

      <Flex justify="space-around" align="center" mt={6} position="relative">
        {orderedBadges.map((badge, index) => (
          <VStack
            spacing={1}
            key={index}
            // If this is the third milestone, move it up slightly.
            transform={badge === thirdMilestoneUrl ? "translateY(-1rem)" : undefined}
          >
            <Box
              bg="gray.900"
              borderRadius="md"
              w={index === 1 ? "80px" : "60px"}
              h={index === 1 ? "80px" : "60px"}
              display="flex"
              alignItems="center"
              justifyContent="center"
              border={index === 1 ? "3px solid #FF7A00" : "2px solid #FF7A00"}
            >
              <Image
                src={badge}
                alt={badgeMapping[badge] || "Badge"}
                borderRadius="full"
              />
            </Box>
            <Text fontSize="xs" fontWeight="medium">
              {badgeMapping[badge] || "Badge"}
            </Text>
          </VStack>
        ))}
      </Flex>

      {/* Toggle Button to switch views */}
      <Button
        onClick={() => {
          setShowPersonalInfo(prev => !prev);
          setStep(!step);
        }}
        colorScheme="orange"
        mt={8}
      >
        {showPersonalInfo ? "View Progress" : "View Personal Info"}
      </Button>

      {/* Navigation Bar using Chakra UI with onClick switching */}
      <Box display="flex" justifyContent="space-between" alignItems="center" width="90%" mx="auto" mt={4}>
        <Box
          flex="1"
          height="6px"
          borderRadius="full"
          bg={step ? "teal.400" : "gray.300"}
          mr={1}
          transition="background-color 0.3s ease"
          onClick={() => {
            setStep(true);
            setShowPersonalInfo(false);
          }}
          cursor="pointer"
        />
        <Box
          flex="1"
          height="6px"
          borderRadius="full"
          bg={!step ? "teal.400" : "gray.300"}
          ml={1}
          transition="background-color 0.3s ease"
          onClick={() => {
            setStep(false);
            setShowPersonalInfo(true);
          }}
          cursor="pointer"
        />
      </Box>

      {showPersonalInfo ? (
        // Display user's personal info when toggled on
        <PersonalInfo userData={userData} loading={loading} />
      ) : (
        // Otherwise, display the progress toward next milestone (if any pending)
        pendingMilestones.length > 0 && (
          <>
            <Flex align="center" mt={8} mb={2}>
              <Text fontSize="lg" fontWeight="bold" textAlign="center" w="100%">
                Progress Toward Next Milestone
              </Text>
              <Spacer />
            </Flex>
            <VStack spacing={4}>
              {pendingMilestones.map((milestone, index) => {
                const progress = Math.floor((milestone.current / milestone.threshold) * 100);
                return (
                  <Flex
                    key={index}
                    align="center"
                    p={3}
                    borderRadius="md"
                    bg="gray.50"
                    boxShadow="sm"
                    w="100%"
                  >
                    <Box textAlign="left">
                      <Text fontWeight="medium" fontSize="xs">{milestone.name}</Text>
                      <Text fontSize="xs" color="gray.500">
                        {milestone.description} ({milestone.current}/{milestone.threshold})
                      </Text>
                    </Box>
                    <Spacer />
                    <CircularProgress
                      value={progress}
                      color="orange.400"
                      trackColor="gray.200"
                      size="50px"
                      thickness="10px"
                    >
                      <CircularProgressLabel fontSize="xs">
                        {progress}%
                      </CircularProgressLabel>
                    </CircularProgress>
                  </Flex>
                );
              })}
            </VStack>
          </>
        )
      )}
    </Box>
  );
};

export default Badges;
