import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import Tabs from "./src/navigation/Tabs";
import { EventsProvider } from "./src/context/EventsContext";

export default function App() {
  return (
    <EventsProvider>
      <NavigationContainer>
        <Tabs />
      </NavigationContainer>
    </EventsProvider>
  );
}
