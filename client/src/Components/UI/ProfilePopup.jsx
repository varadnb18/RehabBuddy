import {
  Box,
  Button,
  Divider,
  Text,
  VStack,
  HStack,
  Badge,
} from "@chakra-ui/react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Title.css";
import "./ProfilePopup.css";

const ProfilePopup = ({ handleLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();

  return (
    <Box position="relative" display="inline-block">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="signin px-[1.5rem] py-[0.6rem] text-base font-bold text-[#0d2436] border-[1px] border-[#6CB33F] rounded-full bg-white hover:bg-green-50 transition"
      >
        Menu
      </Button>
      {isOpen && (
        <Box
          position="absolute"
          top="110%"
          right="0%"
          width={{ base: "90%", md: "16rem" }} // Adjust width for smaller screens
          height="auto"
          bg="white"
          color="black"
          borderRadius="md"
          boxShadow="lg"
          padding={3}
          zIndex="10"
          className="popupbox"
        >
          <VStack align="stretch" spacing={2}>
            <HStack justifyContent="space-between" paddingX={3} paddingY={2}>
              <Text fontWeight="bold">Messages</Text>
              <Badge colorScheme="red">1 unread</Badge>
            </HStack>
            <Link to="/Profile">
              <Text
                paddingX={3}
                paddingY={2}
                _hover={{ bg: "gray.100", cursor: "pointer" }}
                fontWeight="bold"
              >
                Profile
              </Text>
            </Link>
            <Text
              paddingX={3}
              paddingY={2}
              _hover={{ bg: "gray.100", cursor: "pointer" }}
            >
              Varad
            </Text>

            <Text
              paddingX={3}
              paddingY={2}
              _hover={{ bg: "gray.100", cursor: "pointer" }}
            >
              Help Centre
            </Text>

            <Text
              paddingX={3}
              paddingY={2}
              _hover={{ bg: "gray.100", cursor: "pointer" }}
              color="red.500"
              onClick={() => {
                handleLogout();
                navigate("/");
              }}
            >
              Log out
            </Text>
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default ProfilePopup;
