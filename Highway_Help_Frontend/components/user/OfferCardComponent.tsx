import React from "react";
import { OfferCard } from "./OfferCard";

export default function OfferCardComponent({ item, onAccept, onDismiss }: any) {
  return <OfferCard item={item} onAccept={onAccept} onDismiss={onDismiss} />;
}
