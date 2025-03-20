import React, { useEffect, useState } from "react";
import { db } from "../FireBase/FireBase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Container.css";

function Container() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const HandleClick = (data) => {
    navigate(`/${data.pose}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "exercises"));
        const dataList = querySnapshot.docs.map((doc) => doc.data());

        // Wait at least 3 seconds before displaying data
        setTimeout(() => {
          setData(dataList);
          setLoading(false);
        }, 1500);
      } catch (error) {
        console.error("Error fetching data: ", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div
      className="container grid ml-7 mr-7 gap-4 cursor-pointer"
      style={{
        gridTemplateColumns: "repeat(3, 1fr)",
        placeItems: "center",
        justifyContent:"center"
      }}
    >
      {loading
        ? // Skeleton Loader
          Array(6)
          .fill(0)
          .map((_, index) => (
            <div
              key={index}
              className="flex flex-col items-start w-[21.7rem] animate-pulse"
            >
              <div className="w-full h-[12.4rem] bg-gray-300 rounded-md"></div>
              <div className="flex flex-col p-[0.7rem] gap-2 w-full">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-full"></div>
                <div className="h-3 bg-gray-300 rounded w-5/6"></div>
              </div>
            </div>
          ))
        : // Actual Data
          data.map((datas, index) => (
            <div
              key={index}
             
              onClick={() => HandleClick(datas)}
            >
              <img
                src={datas.img}
                alt={datas.name}
                className="w-[21.7rem] h-[12.4rem] object-cover"
              />
              <div className="flex-col content p-[0.7rem] pb-[0rem]">
                <h4 className=" text-[#3F6E71] font-[700] leading-[1.5rem]">
                  {datas.name}
                </h4>
                <p className="des leading-[1.5rem] text-red-500 mb-[1rem] text-[0.6rem]" style={{fontSize:"0.9rem"}}>
  {datas.description}
</p>

              </div>
            </div>
          ))}
    </div>
  );
}

export default Container;