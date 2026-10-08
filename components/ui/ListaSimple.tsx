import type { ReactElement } from 'react';
import { Fragment } from 'react';
import { View } from 'react-native';

interface Props<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (info: { item: T }) => ReactElement | null;
}

// Reemplaza a FlatList con scrollEnabled={false}: en la web de celular esa combinación
// pone "touch-action: none" y no deja arrastrar la pantalla con el dedo sobre la lista.
export function ListaSimple<T>({ data, keyExtractor, renderItem }: Props<T>) {
  return (
    <View>
      {data.map((item) => (
        <Fragment key={keyExtractor(item)}>{renderItem({ item })}</Fragment>
      ))}
    </View>
  );
}
