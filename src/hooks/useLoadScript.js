// hooks/useLoadScript.js
import { useEffect, useState } from "react";

function useLoadScript(url) {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
      setScriptLoaded(true);
      return;
    }

    const scriptTag = document.createElement("script");
    scriptTag.src = url;
    scriptTag.async = true;
    scriptTag.defer = true;
    scriptTag.onload = () => setScriptLoaded(true);
    document.body.appendChild(scriptTag);

    return () => {
      document.body.removeChild(scriptTag);
    };
  }, [url]);

  return scriptLoaded;
}

export default useLoadScript;
