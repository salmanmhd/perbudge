"use client";
import { Provider } from "react-redux";
import { store } from "./store"; // Path to your store file

export function ReduxProvider({ children }) {
    return <Provider store={ store }> { children } </Provider>;
}