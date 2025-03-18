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
    navigate(`/${data.name}`);
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
                className="flex flex-col items-center animate-pulse"
              >
                <div className="w-[21.7rem] h-[12.4rem] bg-gray-300 rounded-md"></div>
                <div className="content p-[0.7rem] pb-[0rem] w-full">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mt-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-full mt-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-5/6 mt-2"></div>
                </div>
              </div>
            ))
        : // Actual Data
          data.map((datas, index) => (
            <div
              key={index}
              className="each-box flex flex-col items-center"
              onClick={() => HandleClick(datas)}
            >
              <img
                src={datas.img}
                alt={datas.name}
                className="w-[21.7rem] h-[12.4rem] object-cover"
              />
              <div className="content p-[0.7rem] pb-[0rem]">
                <h4 className="mt-2 text-[#3F6E71] font-[700] leading-[1.5rem] mb-[0.5rem]">
                  {datas.name}
                </h4>
                <p className="leading-[1.5rem] text-[#343D3C] mb-[1rem]">
                  {datas.description}
                </p>
              </div>
            </div>
          ))}
    </div>
  );
}

export default Container;
