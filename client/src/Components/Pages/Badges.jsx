import React, { useEffect, useState } from "react";
import { auth, db } from "../FireBase/FireBase";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function Badges() {
  const [badges, setBadges] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

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
        console.log("onSnapshot triggered");
        if (docSnap.exists()) {
          setBadges(docSnap.data().badges || []);
        } else {
          console.log("User document does not exist.");
        }
      },
      (error) => {
        console.error("Error fetching badges:", error);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Your Badges</h2>
      {badges.length > 0 ? (
        <div>
          {badges.map((badge, index) => (
            <div key={index} style={{ margin: "10px", fontSize: "18px", color: "green" }}>
              🏅 {badge}
            </div>
          ))}
        </div>
      ) : (
        <p>No badges earned yet.</p>
      )}
    </div>
  );
}

export default Badges;
