import { useEffect } from "react";
import { router } from "expo-router";

function SendPage() {
  useEffect(() => {
    router.replace("/transfer");
  }, []);

  return null;
}

export default SendPage;