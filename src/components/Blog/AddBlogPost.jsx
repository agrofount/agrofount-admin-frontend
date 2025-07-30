import { useCallback, useContext, useEffect, useState } from "react";
import DescriptionEditor from "../Products/ProductDescriptionEditor";
import axios, { HttpStatusCode } from "axios";
import { ShopContext } from "../../context/ShopContext";
import { toast } from "react-toastify";
import { useDropzone } from "react-dropzone";
import { assets } from "../../assets/assets";

const AddBlogPost = ({ post }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [images, setImages] = useState([]);
  const [processing, setProcessing] = useState(false);
  const { backend_url, token, socket, navigate } = useContext(ShopContext);

  const onDrop = useCallback(
    (acceptedFiles) => {
      // Handle the dropped files
      console.log(acceptedFiles);
      if (acceptedFiles.length < 1) {
        toast.error("You need to add at least 1 image");
        return;
      }

      const file = acceptedFiles[0];
      setUploadProgress({});
      setUploading(true);

      // Create a FormData object
      const formData = new FormData();
      formData.append("files", file);
      formData.append("clientId", socket.id);

      // Send the files using Axios
      axios
        .post(`${backend_url}/upload`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((response) => {
          console.log("Files uploaded successfully:", response.data);
          setFiles([
            Object.assign(file, {
              preview: URL.createObjectURL(file),
            }),
          ]);
          setImages(response.data.images[0]);
          setUploading(false);
        })
        .catch((error) => {
          console.error("Error uploading files:", error);
          setUploadProgress({});
          setUploading(false);
        });
    },
    [backend_url, socket.id]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    // Validate form fields
    if (!title || !content) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      // Prepare blog post data
      const blogPostData = {
        title,
        content,
        tags: tags.split(",").map((tag) => tag.trim()),
        coverImage: images,
      };

      let response;

      if (post && post.id) {
        // Update existing blog post
        response = await axios.put(
          `${backend_url}/posts/${post.slug}`,
          blogPostData,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === HttpStatusCode.Ok) {
          toast.success("Blog post updated successfully!");
        }
      } else {
        // Create new blog post
        response = await axios.post(`${backend_url}/posts`, blogPostData, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === HttpStatusCode.Created) {
          toast.success("Blog post created successfully!");
        }
      }

      console.log("Blog post response:", response);
      navigate(`/blogs`);
    } catch (error) {
      console.error("Error saving blog post:", error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    socket.on("uploadProgress", (data) => {
      const { name, percentage } = data;
      setUploadProgress((prevProgress) => ({
        ...prevProgress,
        [name]: percentage,
      }));
    });

    return () => {
      socket.off("uploadProgress");
    };
  }, [socket]);

  useEffect(() => {
    // setPostData(post || {});
    if (post) {
      setTitle(post.title);
      setContent(post.content);
      setTags(Array.isArray(post.tags) ? post.tags.join(", ") : "");
      setImages(post.coverImage);
      setFiles([
        {
          preview: post.coverImage,
        },
      ]);
    }
  }, [post]);

  return (
    <div className="p-5 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Create Blog Post</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="title" className="block font-medium mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            placeholder="Enter blog title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-500 focus:outline-[#61BF75]"
            required
          />
        </div>

        <div>
          <label htmlFor="content" className="block font-medium mb-1">
            Content <span className="text-red-500">*</span>
          </label>
          <DescriptionEditor
            description={content}
            setDescription={setContent}
          />
        </div>

        <div>
          <label htmlFor="tags" className="block font-medium mb-1">
            Tags
          </label>
          <input
            id="tags"
            type="text"
            placeholder="Enter tags separated by commas"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-500 focus:outline-[#61BF75]"
          />
        </div>

        <div>
          <label htmlFor="image" className="block font-medium mb-1">
            Cover Image
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-3">
            {files && files.length > 0 ? (
              <div
                key={files[0].name}
                className="border border-gray-500 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer"
              >
                <img src={files[0].preview} alt="Upload Icon" className="" />
              </div>
            ) : (
              <div className="border border-gray-500 rounded-lg p-3 flex flex-col items-center justify-center">
                <img
                  src={assets.image_placeholder}
                  alt="Upload Icon"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div
              {...getRootProps()}
              className="border border-gray-500 rounded-lg p-3 flex flex-col items-center justify-center hover:border-[#61BF75] cursor-pointer "
            >
              <input {...getInputProps()} />
              {uploading ? (
                <div
                  className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite"
                  role="status"
                >
                  <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                    Loading...
                  </span>
                </div>
              ) : (
                <img src={assets.upload_icon} alt="Upload Icon" />
              )}
              {isDragActive ? (
                <p className="text-sm text-gray-500 leading-1 py-2">
                  Drop the files here ...
                </p>
              ) : (
                <p className="text-sm text-gray-500 leading-1 py-2">
                  Drop your images here or click to browse
                </p>
              )}
              <div className="progress-bar w-full">
                {Object.keys(uploadProgress).map((fileName) => (
                  <div
                    key={fileName}
                    className="h-1 w-full bg-neutral-200 dark:bg-neutral-600 mb-6"
                  >
                    <div
                      className="h-1 bg-[#61BF75]"
                      style={{
                        width: `${uploadProgress[fileName]}%`,
                      }}
                    >
                      <p className="text-xs py-2">
                        {uploadProgress[fileName]}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="px-4 rounded-lg w-1/2  py-3 mx-auto bg-[#61BF75] text-white"
        >
          {processing ? (
            <div className="flex items-center space-x-2">
              <div
                className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
                role="status"
              >
                <span className="sr-only">Processing...</span>
              </div>
              <span className="text-surface text-white">Processing...</span>
            </div>
          ) : (
            "Submit"
          )}
        </button>
      </form>
    </div>
  );
};

export default AddBlogPost;
