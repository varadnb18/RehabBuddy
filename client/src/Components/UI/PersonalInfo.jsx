import React, { useState, useEffect } from "react";
import { User, HeartPulse } from "lucide-react";

const SkeletonLoader = () => (
  <div className="animate-pulse space-y-4">
    {Array(4)
      .fill("")
      .map((_, index) => (
        <div key={index} className="h-6 bg-gray-300 rounded w-60"></div>
      ))}
  </div>
);

const PersonalInfo = ({ userData, loading }) => {
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col pt-6 pb-6 space-y-4">
      <h2 className="text-2xl font-bold mb-2">Personal Details</h2>

      <section>
        <h3 className="text-xl font-semibold text-purple-600 flex items-center mb-2">
          <User className="mr-2 text-purple-600" /> Basic Information
        </h3>
        <div className="grid grid-cols-1 gap-y-2">
          {loading || showLoader ? (
            <SkeletonLoader />
          ) : (
            <>
              <div className="flex gap-x-[55px] text-gray-700">
                <p className="font-semibold text-gray-900">Full Name:</p>
                <p>{userData?.username || "N/A"}</p>
              </div>
              <div className="flex gap-x-10 text-gray-700">
                <p className="font-semibold text-gray-900">Current Age:</p>
                <p>{userData?.age || "N/A"}</p>
              </div>
              <div className="flex gap-x-[72px] text-gray-700">
                <p className="font-semibold text-gray-900">Gender:</p>
                <p>{userData?.gender || "N/A"}</p>
              </div>
              <div className="flex gap-x-1 text-gray-700">
                <p className="font-semibold text-gray-900">Height & Weight:</p>
                <p>
                  {userData?.height || "N/A"}cm / {userData?.weight || "N/A"}kg
                </p>
              </div>
            </>
          )}
        </div>
      </section>

    </div>
  );
};

export default PersonalInfo;
