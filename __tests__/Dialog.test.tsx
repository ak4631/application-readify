import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Modal, Text, TouchableOpacity } from 'react-native';
import { DialogProvider, useAppAlert } from '../context/DialogContext';

const confirm = jest.fn();
function Trigger() {
  const dialog = useAppAlert();
  return (
    <TouchableOpacity
      testID="open-dialog"
      onPress={() =>
        dialog.alert(
          'Cancel booking?',
          'Review your cancellation before continuing.',
          [
            { text: 'Keep booking', style: 'cancel' },
            { text: 'Cancel booking', style: 'destructive', onPress: confirm },
          ],
        )
      }
    >
      <Text>Open</Text>
    </TouchableOpacity>
  );
}

test('themed confirmation dismisses safely on Android back and only confirms explicitly once', async () => {
  let screen!: Renderer.ReactTestRenderer;
  await act(async () => {
    screen = Renderer.create(
      <DialogProvider>
        <Trigger />
      </DialogProvider>,
    );
  });
  const open = () =>
    screen.root.findByProps({ testID: 'open-dialog' }).props.onPress();
  await act(async () => open());
  expect(screen.root.findByType(Modal).props.visible).toBe(true);
  await act(async () => screen.root.findByType(Modal).props.onRequestClose());
  expect(confirm).not.toHaveBeenCalled();
  await act(async () => open());
  const button = screen.root
    .findAllByType(TouchableOpacity)
    .find(node =>
      node
        .findAllByType(Text)
        .some(text => text.props.children === 'Cancel booking'),
    )!;
  await act(async () => {
    button.props.onPress();
    button.props.onPress();
  });
  expect(confirm).toHaveBeenCalledTimes(1);
  expect(screen.root.findByType(Modal).props.visible).toBe(false);
  await act(async () => screen.unmount());
});
