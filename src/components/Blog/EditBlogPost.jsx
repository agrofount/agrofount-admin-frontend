import { useCallback, useEffect, useState } from "react";
import AddBlogPost from "./AddBlogPost";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { apiClient } from "../../lib/apiClient";

const EditBlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState({});

  const fetchPostData = useCallback(async () => {
    try {
      const response = await apiClient.get(`/posts/${slug}`);
      if (response.data) {
        setPost(response.data);
      } else {
        console.log("error", response);
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log("error", error);
      toast.error(error.message);
    }
  }, [slug]);

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
