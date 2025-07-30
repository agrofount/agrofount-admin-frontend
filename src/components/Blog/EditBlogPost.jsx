import { useCallback, useContext, useEffect, useState } from "react";
import { ShopContext } from "../../context/ShopContext";
import AddBlogPost from "./AddBlogPost";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const EditBlogPost = () => {
  const { slug } = useParams();
  const { backend_url } = useContext(ShopContext);
  const [post, setPost] = useState({});

  const fetchPostData = useCallback(async () => {
    try {
      const response = await axios.get(`${backend_url}/posts/${slug}`);
      if (response.data) {
        setPost(response.data);
      } else {
        console.log("error", response);
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log("error", error);
      toast.error(error.response?.data?.message || error.message);
    }
  }, [backend_url, slug]);

  useEffect(() => {
    fetchPostData();
  }, [fetchPostData]);

  return (
    <div>
      <AddBlogPost post={post} />
    </div>
  );
};

export default EditBlogPost;
