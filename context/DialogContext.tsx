import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  Alert as NativeAlert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type AlertButton,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from './ThemeContext';

type Dialog = { title: string; message?: string; buttons: AlertButton[] };
type DialogApi = {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => void;
};
const Context = createContext<DialogApi>(NativeAlert);

export function DialogProvider({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const choosing = useRef(false);
  const alert = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      choosing.current = false;
      setDialog({
        title,
        message,
        buttons: buttons?.length ? buttons : [{ text: 'Got it' }],
      });
    },
    [],
  );
  const api = useMemo(() => ({ alert }), [alert]);
  const destructive = dialog?.buttons.some(
    button => button.style === 'destructive',
  );
  const isError = /failed|could not|invalid|missing|unavailable/i.test(
    dialog?.title ?? '',
  );
  function choose(button?: AlertButton) {
    if (choosing.current) return;
    choosing.current = true;
    setDialog(null);
    button?.onPress?.();
  }
  return (
    <Context.Provider value={api}>
      {children}
      <Modal
        transparent
        visible={!!dialog}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          choose(dialog?.buttons.find(button => button.style === 'cancel'))
        }
      >
        <View style={styles.overlay}>
          <View
            accessibilityViewIsModal
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[styles.icon, { backgroundColor: colors.primaryLight }]}
            >
              <Icon
                name={
                  destructive
                    ? 'help-circle-outline'
                    : isError
                    ? 'alert-circle-outline'
                    : 'checkmark-circle-outline'
                }
                size={32}
                color={isError ? colors.danger : colors.primary}
              />
            </View>
            <Text
              accessibilityRole="header"
              style={[styles.title, { color: colors.text }]}
            >
              {dialog?.title}
            </Text>
            {!!dialog?.message && (
              <ScrollView
                style={styles.messageScroll}
                contentContainerStyle={styles.messageContent}
              >
                <Text
                  accessibilityLiveRegion="polite"
                  style={[styles.message, { color: colors.subText }]}
                >
                  {dialog.message}
                </Text>
              </ScrollView>
            )}
            <View
              style={[
                styles.actions,
                dialog?.buttons.length === 2 && styles.paired,
              ]}
            >
              {dialog?.buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  accessibilityRole="button"
                  style={[
                    styles.button,
                    {
                      backgroundColor:
                        button.style === 'cancel'
                          ? colors.surfaceSubtle
                          : button.style === 'destructive'
                          ? colors.danger
                          : colors.primary,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => choose(button)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        color:
                          button.style === 'cancel'
                            ? colors.text
                            : colors.onPrimary,
                      },
                    ]}
                  >
                    {button.text ?? 'Got it'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </Context.Provider>
  );
}
export const useAppAlert = () => useContext(Context);
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(12,35,23,0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    elevation: 16,
    alignItems: 'center',
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: { fontSize: 15, lineHeight: 23, textAlign: 'center', marginTop: 12 },
  messageScroll: { flexShrink: 1, alignSelf: 'stretch' },
  messageContent: { alignItems: 'center' },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 24 },
  paired: { flexDirection: 'row' },
  button: {
    flexGrow: 1,
    flexBasis: 0,
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
});
