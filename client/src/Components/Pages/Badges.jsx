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
  HStack
} from "@chakra-ui/react";

function Badges() {
  const [badges, setBadges] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);


  const progressBadges = [
    {
      name: "10 Day Streak",
      description: "Open app for 10 days",
      progress: 60
    },
    {
      name: "5,000 Calorie Burn",
      description: "Burn 5K Calories total",
      progress: 32
    }
  ];


  const badgeMapping = {
    "https://www.gstatic.com/webp/gallery/1.webp": "First Milestone",
    "https://www.gstatic.com/webp/gallery/2.webp": "Second Milestone",
    "https://www.gstatic.com/webp/gallery/3.webp": "Third Milestone"
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
          
          setBadges(docSnap.data().badges || []);
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

  return (
    <Box
      maxW="400px"
      mx="auto"
      p={6}
      textAlign="center"
      border="1px solid #eee"
      borderRadius="lg"
      boxShadow="md"
    >
    
      <Text fontSize="4xl" fontWeight="bold">{badges.length}</Text>
      <Text fontSize="md" color="gray.500" mb={10}>Badges Unlocked</Text>

      <Flex justify="space-around" align="center" mt={6} position="relative">
        {badges.map((badge, index) => (
          <VStack spacing={1} key={index}>
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
            <Text fontSize={index === 1 ? "md" : "sm"} fontWeight={index === 1 ? "bold" : "medium"}>
              {badgeMapping[badge] || "Badge"}
            </Text>
          </VStack>
        ))}
      </Flex>

      <Flex align="center" mt={8} mb={2}>
        <Text fontSize="lg" fontWeight="bold">Your Next Badge</Text>
        <Spacer />
      </Flex>

      <VStack spacing={4}>
        {progressBadges.map((badge, index) => (
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
              <Text fontWeight="medium" fontSize="md">{badge.name}</Text>
              <Text fontSize="sm" color="gray.500">{badge.description}</Text>
            </Box>
            <Spacer />
            <CircularProgress
              value={badge.progress}
              color="orange.400"
              trackColor="gray.200"
              size="50px"
              thickness="10px"
            >
              <CircularProgressLabel fontSize="xs">
                {badge.progress}%
              </CircularProgressLabel>
            </CircularProgress>
          </Flex>
        ))}
      </VStack>
    </Box>
  );
}

export default Badges;
