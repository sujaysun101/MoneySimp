import React, { useEffect, useState } from "react";
import { useTranslation } from "./TranslationProvider";

// Usage: <T>Some text</T>
export function T({ children }: { children: string }) {
  const { translate, language } = useTranslation();
  const [translated, setTranslated] = useState(children);

  useEffect(() => {
    let isMounted = true;
    translate(children).then((result) => {
      if (isMounted) setTranslated(result);
    });
    return () => {
      isMounted = false;
    };
  }, [children, language, translate]);

  return <>{translated}</>;
}
