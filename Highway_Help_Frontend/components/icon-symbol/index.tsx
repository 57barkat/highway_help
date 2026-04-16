import React from "react";
import {
  OpaqueColorValue,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import Fontisto from "@expo/vector-icons/Fontisto";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AntDesign from "@expo/vector-icons/AntDesign";
import * as LucideIcons from "lucide-react-native";

export type IconLibrary =
  | "MaterialIcons"
  | "Ionicons"
  | "FontAwesome"
  | "MaterialCommunityIcons"
  | "FontAwesome6"
  | "Feather"
  | "FontAwesome5"
  | "FontAwesome5Brands"
  | "Fontisto"
  | "AntDesign"
  | "Lucide";

export type IconSymbolName =
  | React.ComponentProps<typeof MaterialIcons>["name"]
  | React.ComponentProps<typeof Ionicons>["name"]
  | React.ComponentProps<typeof FontAwesome>["name"]
  | React.ComponentProps<typeof MaterialCommunityIcons>["name"]
  | React.ComponentProps<typeof FontAwesome6>["name"]
  | React.ComponentProps<typeof Feather>["name"]
  | React.ComponentProps<typeof FontAwesome5>["name"]
  | React.ComponentProps<typeof Fontisto>["name"]
  | React.ComponentProps<typeof AntDesign>["name"]
  | keyof typeof LucideIcons;

/**
 * A flexible icon component that supports multiple icon libraries.
 */
export function IconSymbol({
  name,
  library = "MaterialIcons",
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  library?: IconLibrary;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
}) {
  const renderIcon = () => {
    const commonProps = {
      color,
      size,
      name: name as any, // Type assertion needed due to union type
      style: style as StyleProp<TextStyle>,
    };

    switch (library) {
      case "Ionicons":
        return <Ionicons {...commonProps} />;
      case "FontAwesome":
        return <FontAwesome {...commonProps} />;
      case "MaterialCommunityIcons":
        return <MaterialCommunityIcons {...commonProps} />;
      case "FontAwesome6":
        return <FontAwesome6 {...commonProps} />;
      case "Feather":
        return <Feather {...commonProps} />;
      case "FontAwesome5":
        return <FontAwesome5 {...commonProps} />;
      case "FontAwesome5Brands":
        return <FontAwesome5 {...commonProps} />;
      case "Fontisto":
        return <Fontisto {...commonProps} />;
      case "AntDesign":
        return <AntDesign {...commonProps} />;
      case "Lucide":
        const LucideComponent = LucideIcons[
          name as keyof typeof LucideIcons
        ] as React.ComponentType<any>;
        return LucideComponent ? (
          <LucideComponent color={color} size={size} style={style} />
        ) : null;
      case "MaterialIcons":
      default:
        return <MaterialIcons {...commonProps} />;
    }
  };

  return renderIcon();
}
