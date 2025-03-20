const PersonalInfo = ({ userData, loading }) => {

  return (
    <div className="flex flex-col pt-6 pb-6 space-y-4">
      <h2 className="text-xl font-bold mb-2">Personal Details</h2>

      <section>

      <div className="grid grid-cols-1 gap-y-4 items-center text-center">
  <div className="flex flex-col items-center text-gray-700 space-y-2">
    <div className="flex justify-between w-full max-w-xs">
      <p className="font-semibold text-gray-900">Full Name:</p>
      <p>{userData?.username || "N/A"}</p>
    </div>
    <div className="flex justify-between w-full max-w-xs">
      <p className="font-semibold text-gray-900">Current Age:</p>
      <p>{userData?.age || "N/A"}</p>
    </div>
    <div className="flex justify-between w-full max-w-xs">
      <p className="font-semibold text-gray-900">Gender:</p>
      <p>{userData?.gender || "N/A"}</p>
    </div>
    <div className="flex justify-between w-full max-w-xs">
      <p className="font-semibold text-gray-900">Height & Weight:</p>
      <p>
        {userData?.height || "N/A"}cm / {userData?.weight || "N/A"}kg
      </p>
    </div>
  </div>
</div>

      </section>

    </div>
  );
};

export default PersonalInfo;
