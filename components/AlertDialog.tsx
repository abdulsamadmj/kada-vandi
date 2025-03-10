import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';

interface AlertDialogProps {
  isVisible: boolean;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  cancelText?: string;
  onCancel: () => void;
  options?: Array<{
    text: string;
    onPress: () => void;
  }>;
}

export function AlertDialog({
  isVisible,
  title,
  message,
  confirmText,
  onConfirm,
  cancelText = 'Cancel',
  onCancel,
  options,
}: AlertDialogProps) {
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {options && options.length > 0 && (
            <View style={styles.optionsContainer}>
              {options.map((option, index) => (
                <Pressable
                  key={index}
                  onPress={option.onPress}
                  style={({ pressed }) => [
                    styles.optionButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.optionText}>{option.text}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 340,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
  },
  optionText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});