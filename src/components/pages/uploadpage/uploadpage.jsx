import React, { useState, useContext, useEffect, useRef } from "react";
import Navbar from "../../navbar/navbar";
import axios from "axios";
import Footer from "../../Footer/Footer";
import "./uploadpage.css";
import { FaFolderPlus } from "react-icons/fa";
import { FiFilePlus } from "react-icons/fi";
import TokenContext from "../../assets/TokenContext";
import { Link } from "react-router-dom";
import { SiIpfs } from "react-icons/si";

import { GrStorage } from "react-icons/gr";
import {
    FaFilePdf,
    FaFileImage,
    FaFileAlt,
    FaFileVideo,
    FaFileAudio,
    FaFileCode,
    FaFileWord,
    FaFileExcel,
    FaFilePowerpoint,
    FaFileArchive,
    FaFileCsv,
} from "react-icons/fa";

const fileTypeIcons = {
    pdf: <FaFilePdf />,
    jpg: <FaFileImage />,
    jpeg: <FaFileImage />,
    png: <FaFileImage />,
    gif: <FaFileImage />,
    svg: <FaFileImage />,
    bmp: <FaFileImage />,
    txt: <FaFileAlt />,
    doc: <FaFileWord />,
    docx: <FaFileWord />,
    xls: <FaFileExcel />,
    xlsx: <FaFileExcel />,
    ppt: <FaFilePowerpoint />,
    pptx: <FaFilePowerpoint />,
    mp4: <FaFileVideo />,
    mkv: <FaFileVideo />,
    flv: <FaFileVideo />,
    webm: <FaFileVideo />,
    avchd: <FaFileVideo />,
    whm: <FaFileVideo />,
    mov: <FaFileVideo />,
    avi: <FaFileVideo />,

    wmv: <FaFileVideo />,

    mp3: <FaFileAudio />,
    wav: <FaFileAudio />,
    aac: <FaFileAudio />,
    flac: <FaFileAudio />,
    html: <FaFileCode />,
    css: <FaFileCode />,
    js: <FaFileCode />,
    jsx: <FaFileCode />,
    ts: <FaFileCode />,
    tsx: <FaFileCode />,
    json: <FaFileCode />,
    xml: <FaFileCode />,
    csv: <FaFileCsv />,
    zip: <FaFileArchive />,
    rar: <FaFileArchive />,
    "7z": <FaFileArchive />,
    tar: <FaFileArchive />,
    gz: <FaFileArchive />,
    bz2: <FaFileArchive />,

    // Add or remove file types as needed
};

function UploadPage() {
    const [files, setFiles] = useState([]);
    const [account, setAccount] = useState("");
    const [selectedFiles, setSelectedFiles] = useState(new Set());
    const contextMenuRef = useRef(null);
    const [contextMenuFileIds, setContextMenuFileIds] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const fileInputRef = useRef(null);
    const [isHoveredStorage, setIsHoveredStorage] = useState(false);
    const [isHoveredIpfs, setIsHoveredIpfs] = useState(false);

    const [totalUploadedSize, setTotalUploadedSize] = useState(0);
    const [uploadQueue, setUploadQueue] = useState([]);
    const { tokenBalance } = useContext(TokenContext);
    const [maxUploadSize, setMaxUploadSize] = useState(5 * 1024 * 1024 * 1024); // Default to 5GB
    const [windowSize, setWindowSize] = useState(window.innerWidth);
    const isWalletConnected = account && window.ethereum;

    useEffect(() => {
        console.log("Updated tokenBalance: ", tokenBalance); // For debugging
        let newSize;
        if (tokenBalance >= 1500001 && tokenBalance <= 2000000) {
            newSize = 10 * 1024 * 1024 * 1024; // 10GB
        } else if (tokenBalance >= 1000001 && tokenBalance <= 1500000) {
            newSize = 5 * 1024 * 1024 * 1024; // 5GB
        } else if (tokenBalance >= 500001 && tokenBalance <= 1000000) {
            newSize = 1024 * 1024 * 1024; // 1GB
        } else if (tokenBalance >= 100001 && tokenBalance <= 500000) {
            newSize = 500 * 1024 * 1024; // 500MB
        } else if (tokenBalance >= 10001 && tokenBalance <= 100000) {
            newSize = 100 * 1024 * 1024; // 100MB
        } else if (tokenBalance >= 1 && tokenBalance <= 10000) {
            newSize = 10 * 1024 * 1024; // 10MB
        } else {
            newSize = 5 * 1024 * 1024; // Default to 5MB for 0 or negative token balances
        }
        setMaxUploadSize(newSize);
    }, [tokenBalance]);

    console.log(tokenBalance);
    useEffect(() => {
        const fetchWalletAddress = async () => {
            const accounts = await window.ethereum?.request({
                method: "eth_accounts",
            });
            if (accounts?.length > 0) {
                setAccount(accounts[0]);
            }
        };

        fetchWalletAddress();
    }, []);

    const fetchFiles = async () => {
        if (account) {
            try {
                const response = await axios.get(
                    `https://dapp.blockfile.xyz/api/files?walletAddress=${account}`
                );
                console.log(response.data); // Log to see the data structure
                setFiles(response.data);
            } catch (error) {
                console.error("Error fetching files:", error);
            }
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [account]);

    useEffect(() => {
        const handleRightClick = (event) => {
            event.preventDefault();
        };

        document.addEventListener("contextmenu", handleRightClick);
        return () => {
            document.removeEventListener("contextmenu", handleRightClick);
        };
    }, []);
    const recalculateUploadPercentage = async () => {
        await fetchTotalUploadedSize(); // Fetch the updated total uploaded size
        fetchFiles(); // Fetch the updated files list
    };
    const fetchTotalUploadedSize = async () => {
        if (account) {
            try {
                const response = await axios.get(
                    `https://dapp.blockfile.xyz/api/totalSize?walletAddress=${account}`
                );
                const { totalSize } = response.data;
                setTotalUploadedSize(totalSize);
            } catch (error) {
                console.error("Error fetching total uploaded size:", error);
                setTotalUploadedSize(0); // Reset to 0 in case of error
            }
        }
    };
    useEffect(() => {
        fetchTotalUploadedSize();
    }, [account]);

    const handleFileChange = (event) => {
        const selectedFiles = Array.from(event.target.files);
        const newQueue = selectedFiles.map((file) => {
            const { token, cancel } = axios.CancelToken.source();
            return {
                file,
                progress: 0,
                status: "queued",
                cancelToken: token, // Add the token here
                cancel, // Add the cancel function here
            };
        });
        setUploadQueue((prevQueue) => [...prevQueue, ...newQueue]);
    };

    const updateFileProgress = (index, progress) => {
        setUploadQueue((currentQueue) =>
            currentQueue.map((file, i) =>
                i === index ? { ...file, progress } : file
            )
        );
    };
    const updateTotalUploadedSize = () => {
        const totalSize = uploadQueue.reduce((acc, file) => {
            return acc + (file.status === "done" ? file.file.size : 0);
        }, 0);
        setTotalUploadedSize(totalSize);
    };
    const updateFileStatus = (index, status) => {
        setUploadQueue((currentQueue) =>
            currentQueue.map((file, i) =>
                i === index ? { ...file, status } : file
            )
        );
        // Add this line to update the total uploaded size whenever a file's status is updated
        updateTotalUploadedSize();
    };
    // const handleFolderChange = (event) => {
    //     const files = Array.from(event.target.files); // Convert FileList to Array
    //     console.log(files); // Optional: Log the files to be uploaded
    //     // Update state or variables for upload process
    //     setSelectedFiles(files); // Assuming setSelectedFiles is your method to update state
    // };

    const toggleFileSelection = (fileId) => {
        const newSelection = new Set(selectedFiles);
        if (newSelection.has(fileId)) {
            newSelection.delete(fileId);
        } else {
            newSelection.add(fileId);
        }
        setSelectedFiles(newSelection);
    };

    const handleUpload = async () => {
        let allUploadsCompleted = true;

        // Calculate the size of files being uploaded
        const filesToUploadSize = uploadQueue.reduce(
            (acc, fileData) => acc + fileData.file.size,
            0
        );

        // Check if adding these files would exceed the max upload size
        if (totalUploadedSize + filesToUploadSize > maxUploadSize) {
            alert("You have exceeded your allocated upload space.");
            return; // Stop the upload process
        }

        for (let i = 0; i < uploadQueue.length; i++) {
            const fileData = uploadQueue[i];
            if (fileData.status === "queued") {
                updateFileStatus(i, "uploading");

                const formData = new FormData();
                formData.append("file", fileData.file);
                formData.append("walletAddress", account);

                try {
                    await axios.post(
                        "https://dapp.blockfile.xyz/api/upload",
                        formData,
                        {
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                            onUploadProgress: (progressEvent) => {
                                const percentCompleted = Math.round(
                                    (progressEvent.loaded * 100) /
                                        progressEvent.total
                                );
                                updateFileProgress(i, percentCompleted);
                            },
                            cancelToken: fileData.cancelToken,
                        }
                    );

                    updateFileStatus(i, "done");
                    setTotalUploadedSize(
                        (prevSize) => prevSize + fileData.file.size
                    );
                } catch (error) {
                    if (axios.isCancel(error)) {
                        console.log("Upload canceled", error.message);
                        updateFileStatus(i, "cancelled");
                    } else {
                        console.error("Error uploading file:", error);
                        updateFileStatus(i, "error");
                    }
                    allUploadsCompleted = false;
                }
            }
        }

        const allFilesProcessed = () =>
            uploadQueue.every((file) =>
                ["done", "error", "cancelled"].includes(file.status)
            );

        const checkUploadCompletion = setInterval(() => {
            if (allFilesProcessed()) {
                clearInterval(checkUploadCompletion);
                if (allUploadsCompleted) {
                    alert("All files have been uploaded successfully!");

                    fetchFiles();
                } else {
                    alert("Some files were not uploaded successfully.");
                }
            }
        }, 500);
    };

    const handleContextMenu = (event, fileId) => {
        event.preventDefault();
        if (selectedFiles.has(fileId) || selectedFiles.size > 0) {
            const selectedFileIds =
                selectedFiles.size > 1 ? [...selectedFiles] : [fileId];
            setContextMenuFileIds(selectedFileIds); // Update to use the new state

            const menu = contextMenuRef.current;
            menu.style.top = `${event.clientY}px`;
            menu.style.left = `${event.clientX}px`;
            menu.style.display = "block";
        }
    };

    const hideContextMenu = () => {
        const menu = contextMenuRef.current;
        if (menu) {
            menu.style.display = "none";
        }
    };

    useEffect(() => {
        // Check if all files in the queue have a status of 'done', 'error', or 'cancelled'
        const allUploadsCompleted = uploadQueue.every((file) =>
            ["done", "error", "cancelled"].includes(file.status)
        );

        if (allUploadsCompleted && uploadQueue.length > 0) {
            fetchFiles(); // Refresh the file list
            fetchTotalUploadedSize(); // Update the total uploaded size
        }
    }, [uploadQueue]);
    const removeFileFromQueue = (indexToRemove) => {
        const fileData = uploadQueue[indexToRemove];

        if (fileData.status === "uploading") {
            const confirmCancel = window.confirm(
                "Do you want to cancel uploading?"
            );
            if (confirmCancel) {
                fileData.cancel("Upload cancelled by the user."); // Cancel the upload
                setUploadQueue((currentQueue) =>
                    currentQueue.filter((_, index) => index !== indexToRemove)
                );
            }
        } else {
            setUploadQueue((currentQueue) =>
                currentQueue.filter((_, index) => index !== indexToRemove)
            );
        }
    };

    const deleteFiles = async () => {
        if (selectedFiles.size === 0) {
            alert("Please select one or more files to delete.");
            return;
        }

        const fileIds = Array.from(selectedFiles);

        try {
            const response = await axios.post(
                "https://dapp.blockfile.xyz/api/delete-multiple",
                { fileIds },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.data.success) {
                // Update local state to reflect the deletion
                setFiles((prevFiles) =>
                    prevFiles.filter((file) => !selectedFiles.has(file._id))
                );
                // Clear selection after deletion
                await recalculateUploadPercentage();
                setSelectedFiles(new Set());
                alert("Selected files deleted successfully!");
            } else {
                alert("Failed to delete selected files.");
            }
        } catch (error) {
            console.error("Error deleting selected files:", error);
            alert("Error deleting selected files.");
        }
        hideContextMenu();
    };

    const moveFile = (fileId) => {
        // Placeholder logic for moving a file
        console.log("Move File", fileId);
        hideContextMenu();
        // You might display a modal for the user to select a new folder or similar
    };

    const copyLink = (fileId) => {
        // Find the file object based on fileId
        const file = files.find((f) => f._id === fileId);
        if (file) {
            // Assuming the download URL is something like 'https://dapp.blockfile.xyz/download/{fileId}'
            // Adjust this URL structure as needed for your app
            const downloadUrl = `https://dapp.blockfile.xyz/download/${fileId}`;

            // Use the navigator.clipboard API to copy the download URL to the clipboard
            navigator.clipboard
                .writeText(downloadUrl)
                .then(() => alert("Link copied to clipboard!"))
                .catch((err) => alert("Failed to copy link. Error: " + err));
            hideContextMenu();
        } else {
            alert("File not found.");
        }
    };

    useEffect(() => {
        const handleGlobalClick = (e) => {
            if (
                contextMenuRef.current &&
                !contextMenuRef.current.contains(e.target)
            ) {
                hideContextMenu();
            }
        };

        document.addEventListener("click", handleGlobalClick);
        return () => document.removeEventListener("click", handleGlobalClick);
    }, []);

    const closeModal = () => {
        // Check if all files are done uploading
        const allDone = uploadQueue.every((file) => file.status === "done");
        setIsModalOpen(false);
        fetchFiles(); // Fetch latest files list
        setUploadQueue([]);
        let shouldCloseModal = true; // Assume we can close the modal

        // If not all files are done uploading and there are files in the upload queue, ask the user for confirmation
        if (!allDone && uploadQueue.length > 0) {
            shouldCloseModal = window.confirm(
                "Do you want to clear your selection?"
            );
        }

        if (shouldCloseModal) {
            setIsModalOpen(false); // Close the modal
            setUploadQueue([]); // Clear the upload queue
        }
        // If the user cancels and there are files in the queue, the modal remains open
    };

    const handleUploadButtonClick = () => {
        // Toggle the state to show/hide the modal
        setIsModalOpen(!isModalOpen);
    };
    const handleIconClick = () => {
        // When the icon is clicked, trigger a click on the file input
        fileInputRef.current.click();
    };
    // const handleCreateFolder = async () => {
    //     if (!newFolderName) {
    //         alert("Please enter a folder name!");
    //         return;
    //     }

    //     try {
    //         const response = await axios.post(
    //             "https://dapp.blockfile.xyz/api/create-folder",
    //             {
    //                 folderName: newFolderName,
    //                 walletAddress: account, // Assuming you're storing the wallet address in state
    //             }
    //         );

    //         // Update your local state to reflect the new folder
    //         const newFolder = response.data.dbData;
    //         setFiles((prevFiles) => [...prevFiles, newFolder]);
    //         setNewFolderName(""); // Clear the input field
    //         alert("Folder created successfully!");
    //     } catch (error) {
    //         console.error("Error creating folder:", error);
    //         alert("Error creating folder.");
    //     }
    // };
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + " Bytes";
        else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
        else if (bytes < 1024 * 1024 * 1024)
            return (bytes / 1024 / 1024).toFixed(2) + " MB";
        else return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
    }
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allFileIds = new Set(files.map((file) => file._id));
            setSelectedFiles(allFileIds);
        } else {
            setSelectedFiles(new Set()); // Deselect all
        }
    };
    const uploadPercentage = Math.min(
        100,
        (totalUploadedSize / maxUploadSize) * 100
    ).toFixed(2);

    const iconSize = windowSize >= 768 ? 200 : 50;
    useEffect(() => {
        function handleResize() {
            setWindowSize(window.innerWidth);
        }

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div>
            <div className="bg-gray-900 text-white h-screen font-anta bg  ">
                <Navbar />
                <div className="flex">
                    {/* <div className="w-1/4 p-4 border-r border-gray-700 my-3">
                    <h2 className="text-lg font-semibold mb-4">My Folders</h2>
                    <div className="mb-4 space-y-4">
                        <div>
                            <input
                                type="text"
                                placeholder=" New folder name"
                                value={newFolderName}
                                onChange={(e) =>
                                    setNewFolderName(e.target.value)
                                }
                                className="text-input text-black rounded-md text-center"
                            />
                        </div>
                        <div>
                            <button
                                onClick={handleCreateFolder}
                                className="create-folder-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                Create Folder
                            </button>
                        </div>
                    </div>
                    <div>
                        <p>You don't have any folders</p>
                    </div>
                </div> */}
                    <div className="w-full p-4">
                        <div className=" md:flex justify-between mx-6 my-2 ">
                            <div className="mt-3  ">
                                <span className="text-lg font-semibold  ">
                                    My Files
                                </span>
                            </div>
                            <Link to="/uploadpage">
                                <div
                                    className="border-2 flex justify-center sm:my-2 rounded-xl hover:shadow-green-500/50 hover:shadow-lg hover:border-green-500 transition duration-300 ease-in-out"
                                    onMouseEnter={() =>
                                        setIsHoveredStorage(true)
                                    }
                                    onMouseLeave={() =>
                                        setIsHoveredStorage(false)
                                    }>
                                    <div className="ml-2 my-2">
                                        <GrStorage
                                            size={24}
                                            style={{
                                                color: isHoveredStorage
                                                    ? "green"
                                                    : "currentColor",
                                                transition:
                                                    "color 300ms ease-in-out", // Smooth transition for color
                                            }}
                                        />
                                    </div>
                                    <div className="mt-2">
                                        <span
                                            className={`mx-2 my-2 animate-pulse ${
                                                isHoveredStorage
                                                    ? "text-green-500"
                                                    : ""
                                            } transition duration-300 ease-in-out`} // Apply transition to the span as well
                                        >
                                            UPLOAD WEB SPACE
                                        </span>
                                    </div>
                                </div>
                            </Link>
                            <Link to="/uploadpageipfs">
                                <div
                                    className="border-2 flex justify-center sm:my-2 rounded-xl hover:shadow-green-500/50 hover:shadow-lg hover:border-green-500 transition duration-300 ease-in-out"
                                    onMouseEnter={() => setIsHoveredIpfs(true)}
                                    onMouseLeave={() =>
                                        setIsHoveredIpfs(false)
                                    }>
                                    <div className="ml-2 my-2">
                                        <SiIpfs
                                            size={24}
                                            style={{
                                                color: isHoveredIpfs
                                                    ? "green"
                                                    : "currentColor",
                                                transition:
                                                    "color 300ms ease-in-out", // Ensure smooth color transition
                                            }}
                                        />
                                    </div>
                                    <div className="mt-2">
                                        <span
                                            className={`mx-2 my-2 animate-pulse ${
                                                isHoveredIpfs
                                                    ? "text-green-500"
                                                    : ""
                                            } transition duration-300 ease-in-out`} // Smooth transition for the text color
                                        >
                                            UPLOAD IPFS
                                        </span>
                                    </div>
                                </div>
                            </Link>
                            <div className="md:flex sm:space-y-4 space-x-4">
                                <div className="">
                                    <div className="w-full bg-gray-300 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full"
                                            style={{
                                                width: `${uploadPercentage}%`,
                                            }}></div>
                                    </div>
                                    <div className="text-sm sm:text-center md:text-right mt-1">
                                        {uploadPercentage}% (
                                        {(
                                            totalUploadedSize /
                                            (1024 * 1024)
                                        ).toFixed(2)}{" "}
                                        MB /{" "}
                                        {(
                                            maxUploadSize /
                                            (1024 * 1024)
                                        ).toFixed(2)}{" "}
                                        MB)
                                    </div>
                                </div>
                                <div className="">
                                    <button
                                        onClick={handleUploadButtonClick}
                                        className={`${
                                            isWalletConnected
                                                ? "bg-blue-500 hover:bg-blue-700"
                                                : "bg-gray-500 cursor-not-allowed"
                                        } text-white font-bold py-2 px-4 rounded`}
                                        disabled={!isWalletConnected}>
                                        Upload
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex  mx-6 my-2 space-x-4 ">
                            <div className=" ">
                                <div className=" ">
                                    <input
                                        type="checkbox"
                                        className="form-checkbox "
                                        onChange={handleSelectAll}
                                        checked={
                                            files.length > 0 &&
                                            selectedFiles.size === files.length
                                        }
                                    />

                                    <span className=""> SELECT ALL FILES</span>
                                </div>
                            </div>
                        </div>
                        {files.length === 0 ? (
                            <div className="text-center">
                                {isWalletConnected
                                    ? "This folder is empty"
                                    : "Please connect your MetaMask wallet first."}
                            </div>
                        ) : (
                            <div className="files-table-container md:max-h-[750px] overflow-y-auto  sm:max-h-[600px]">
                                <table className="min-w-full  ">
                                    <tbody>
                                        {Array.isArray(files) &&
                                            files.map((file, idx) => (
                                                <tr
                                                    key={file.fileId}
                                                    className={`border-b hover:bg-slate-700 border-gray-700 ${
                                                        selectedFiles.has(
                                                            file._id
                                                        )
                                                            ? "bg-blue-500" // Highlight selected rows
                                                            : "bg-transparent"
                                                    }`}
                                                    onClick={() =>
                                                        toggleFileSelection(
                                                            file._id
                                                        )
                                                    }
                                                    onContextMenu={(e) =>
                                                        handleContextMenu(
                                                            e,
                                                            file._id
                                                        )
                                                    }>
                                                    <td className="px-6 text-sm font-medium text-left ">
                                                        <div className="flex items-center space-x-3 ">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedFiles.has(
                                                                    file._id
                                                                )}
                                                                onChange={() =>
                                                                    toggleFileSelection(
                                                                        file._id
                                                                    )
                                                                }
                                                                className="form-checkbox  text-blue-600"
                                                            />
                                                            {(() => {
                                                                const fileExtension =
                                                                    file.filename
                                                                        .split(
                                                                            "."
                                                                        )
                                                                        .pop()
                                                                        .toLowerCase();
                                                                const IconComponent =
                                                                    fileTypeIcons[
                                                                        fileExtension
                                                                    ] || (
                                                                        <FaFileAlt />
                                                                    ); // Default to FaFileAlt if extension not found
                                                                return IconComponent; // Use the IconComponent directly
                                                            })()}

                                                            {/* Always visible on medium screens and up */}
                                                            <div>
                                                                <span className="hidden sm:block truncate max-w-xs">
                                                                    {
                                                                        file.filename
                                                                    }
                                                                </span>
                                                                {/* Visible only on small screens */}
                                                                <span className="block sm:hidden truncate max-w-xs">
                                                                    {file
                                                                        .filename
                                                                        .length >
                                                                    6
                                                                        ? `${file.filename.substring(
                                                                              0,
                                                                              6
                                                                          )}…`
                                                                        : file.filename}
                                                                </span>
                                                                <span className="file-size text-xs text-gray-400 ">
                                                                    {formatFileSize(
                                                                        file.size
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-xs text-gray-500"></td>
                                                    <td className="text-xs text-gray-500">
                                                        {new Date(
                                                            file.createdAt
                                                        ).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
                <div
                    ref={contextMenuRef}
                    className="context-menu"
                    onContextMenu={(e) => e.preventDefault()}>
                    {contextMenuFileIds.length === 1 && (
                        <Link to={`/download/${contextMenuFileIds[0]}`}>
                            <button>Download</button>
                        </Link>
                    )}

                    <button onClick={() => deleteFiles(contextMenuFileIds)}>
                        Delete
                    </button>
                    <button onClick={() => moveFile(contextMenuFileIds)}>
                        Move
                    </button>
                    {contextMenuFileIds.length === 1 && (
                        <button onClick={() => copyLink(contextMenuFileIds[0])}>
                            Copy Link
                        </button>
                    )}
                </div>
                {isModalOpen && (
                    <div className="fixed inset-0 backdrop-blur-sm   z-50 flex justify-center items-center ">
                        <div className=" bg-modal p-4 rounded-2xl shadow-lg ">
                            <div>
                                <button
                                    onClick={closeModal}
                                    className="flex justify-end text-5xl text-white">
                                    &times;
                                </button>
                            </div>
                            <h3 className="text-lg font-bold">Upload Files</h3>
                            <div className=" overflow-y-auto max-h-[600px] files-table-container ">
                                {uploadQueue.length > 0 ? (
                                    <div className="sm:mx-2 sm:my-2 md:mx-24 md:my-24">
                                        {uploadQueue.map((fileData, index) => (
                                            <div key={index} className="mb-4">
                                                <div className="flex justify-between items-center space-x-2">
                                                    <div className=" filename ">
                                                        {fileData.file.name}
                                                    </div>
                                                    <button
                                                        onClick={() =>
                                                            removeFileFromQueue(
                                                                index
                                                            )
                                                        }
                                                        className="text-red-500 hover:text-red-700 mr-2">
                                                        X
                                                    </button>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-5 dark:bg-gray-700 my-2 relative">
                                                    <div></div>
                                                    <div
                                                        className="bg-blue-600 h-5 rounded-full text-white text-sm flex items-center justify-end"
                                                        style={{
                                                            width: `${fileData.progress}%`,
                                                        }}>
                                                        <div
                                                            className={`${
                                                                fileData.progress <
                                                                10
                                                                    ? "hidden"
                                                                    : "mx-auto my-auto"
                                                            }`}>
                                                            {fileData.progress}%
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-center text-sm">
                                                    {fileData.status ===
                                                        "uploading" &&
                                                        "Uploading..."}
                                                    {fileData.status ===
                                                        "finalizing" &&
                                                        "Finalizing..."}
                                                    {fileData.status ===
                                                        "done" &&
                                                        "Upload Complete!"}
                                                    {fileData.status ===
                                                        "error" &&
                                                        "Error in upload."}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mx-auto border-2 border-dashed pl-5 my-5">
                                        <div
                                            className="md:mx-24 md:my-24 sm:mx-20 sm:my-20"
                                            onClick={handleIconClick}>
                                            <FaFolderPlus
                                                className="cursor-pointer mx-auto"
                                                size={iconSize}
                                            />

                                            <p className="text-center mt-2">
                                                Add Files
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex space-x-5 justify-center mb-5">
                                    <div
                                        onClick={handleIconClick}
                                        className="cursor-pointer">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple // Allow multiple file selection
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <div className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                            <FiFilePlus size={24} />
                                            <span>Add Files</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleUpload}
                                    disabled={uploadQueue.some(
                                        (file) => file.status === "uploading"
                                    )}
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                    Start Upload
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}

export default UploadPage;
