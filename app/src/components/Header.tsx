import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { IconButton } from "react-native-paper";
import { useRouter } from "expo-router";
import { cn } from "@/utils";

const backIcon = require("@/src/assets/images/back-icon.png");

interface HeaderProps {
  title: string;
  subtitle?: string;
  hasBack?: boolean;
  isHomepage?: boolean;
  prevCallback?: () => void;
}

export default function Header({
  title,
  subtitle,
  hasBack = false,
  isHomepage = false,
  prevCallback,
}: HeaderProps) {
  const router = useRouter();
  const handleBack = () => {
    if (prevCallback) prevCallback();
    else router.back();
  };

  return (
    <View
      className={cn(
        "h-24 px-5 py-5 flex-col justify-end",
        isHomepage ? "bg-background" : "bg-primary"
      )}
    >
      {hasBack ? (
        <View className="flex-row items-center gap-4">
          <Pressable onPress={handleBack}>
            <Image source={backIcon} className="h-5 w-5 " />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text className="font-semibold text-2xl text-white">{title}</Text>
            {subtitle && <Text className="text-white text-lg">{subtitle}</Text>}
          </View>
        </View>
      ) : (
        <View className="items-start">
          <Text
            className={cn(
              "font-semibold text-2xl",
              isHomepage ? "text-primary" : "text-white"
            )}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              className={cn(
                "text-lg",
                isHomepage ? "text-primary" : "text-white"
              )}
            >
              {subtitle}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
