import { useParams, Navigate } from "react-router-dom";

const AdminRedirect = ({ to }) => {
  const params = useParams();
  let newUrl = to;

  for (const key in params) {
    newUrl = newUrl.replace(`:${key}`, params[key]);
  }
  return <Navigate to={newUrl} replace />;
};

export default AdminRedirect;
