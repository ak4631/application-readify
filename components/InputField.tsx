import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, type TextInputProps } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { Radius } from '../constants/radius';
import type { ThemeColors } from '../constants/colors';

type Props = TextInputProps & {
  icon: string;
};

export default function InputField({ icon, secureTextEntry, style, ...rest }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [isSecureVisible, setIsSecureVisible] = useState(false);
  const isPasswordField = !!secureTextEntry;

  return (
    <View style={styles.container}>
      <Icon name={icon} size={19} color={colors.placeholder} style={styles.icon} />
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.placeholder}
        secureTextEntry={isPasswordField && !isSecureVisible}
        {...rest}
      />
      {isPasswordField && (
        <TouchableOpacity
          onPress={() => setIsSecureVisible(current => !current)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon
            name={isSecureVisible ? 'eye-off-outline' : 'eye-outline'}
            size={19}
            color={colors.placeholder}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      height: 56,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.md,
      paddingHorizontal: 16,
      marginBottom: 16,
      backgroundColor: colors.surface,
    },
    icon: { marginRight: 10 },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      paddingVertical: 0,
    },
  });
