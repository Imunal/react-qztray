import { useContext } from "react";
import { QzTrayContext } from "./qztray.context";

export const useQzTray = () => {
	const context = useContext(QzTrayContext);
	if (!context) {
		throw new Error("useQzTray must be used within a QzTrayProvider");
	}

	return context;
};
