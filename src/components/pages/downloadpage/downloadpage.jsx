import React, { useState, useEffect } from "react";
import Navbar from "../../navbar/navbar";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./downloadpage.css";
import logo from "../../assets/Images/logo.png";
import Footer from "../../Footer/Footer";
function DownloadPage() {
    let { id } = useParams();
    const [file, setFile] = useState(null);

    useEffect(() => {
        const fetchFile = async () => {
            try {
                const response = await axios.get(
                    `https://dapp.blockfile.xyz/api/files/${id}`
                );
                if (response.data) {
                    const formattedSize = (
                        response.data.size /
                        1024 /
                        1024
                    ).toFixed(2); // Convert bytes to MB and round to 2 decimal places
                    setFile({
                        ...response.data,
                        formattedSize: `${formattedSize} MB`, // Add formattedSize to the file object
                    });
                }
            } catch (error) {
                console.error("Failed to fetch file:", error);
            }
        };

        fetchFile();
    }, [id]);

    return (
        <div className="bg text-white font-anta h-screen overflow-hidden">
            <Navbar />
            <div className="flex justify-center items-center h-full bg pb-24">
                <div className="w-full max-w-full px-4 bg-gray-800 rounded-lg shadow-md sm:w-auto mx-3">
                    <div>
                        <img
                            src={logo}
                            alt="logo"
                            className=" h-24 w-24 mx-auto animate-spin"
                        />
                    </div>
                    {file ? (
                        <div className="flex flex-col items-center ">
                            <h2 className="text-xl font-semibold mb-2">
                                File Details
                            </h2>
                            <div className="text-center">
                                <p className="filename">
                                    Filename: {file.filename}
                                </p>
                                <p>Size: {file.formattedSize}</p>
                                <p>
                                    Uploaded:{" "}
                                    {new Date(
                                        file.createdAt
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="py-5">
                                <a
                                    href={`https://web3storage.sgp1.cdn.digitaloceanspaces.com/uploads/${file.walletAddress}/${file.filename}`}
                                    download={file.filename}
                                    className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                    Download
                                </a>
                            </div>
                        </div>
                    ) : (
                        <p>Loading file details...</p>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default DownloadPage;
