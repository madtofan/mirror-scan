import { useEffect } from "react";
import { router } from "expo-router";

function ReceivePage() {
  useEffect(() => {
    router.replace("/transfer");
  }, []);

  return null;
}

export default ReceivePage;