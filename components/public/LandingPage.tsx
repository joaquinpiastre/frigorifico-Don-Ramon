import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { COLORS } from '@/constants/colors';

const INSTAGRAM_URL = 'https://www.instagram.com/donramonfrigorifico/';
const TELEFONO_1 = '2604578682';
const TELEFONO_2 = '2604818210';
const DIRECCION = 'Espínola 589';

const PRODUCTOS = [
  {
    icon: 'restaurant-outline' as const,
    titulo: 'Vacuno',
    desc: 'Cortes de res seleccionados, con trazabilidad de tropa y garrón.',
  },
  {
    icon: 'flame-outline' as const,
    titulo: 'Cerdo',
    desc: 'Variedad de cortes de cerdo frescos, ideales para cada ocasión.',
  },
  {
    icon: 'ribbon-outline' as const,
    titulo: 'Toro',
    desc: 'Calidad superior para quienes buscan lo mejor del mostrador.',
  },
  {
    icon: 'fast-food-outline' as const,
    titulo: 'Embutidos y otros',
    desc: 'Chorizos, morcillas y demás productos de elaboración propia.',
  },
];

const BENEFICIOS = [
  { icon: 'ribbon-outline' as const, titulo: 'Calidad de siempre', desc: 'La misma calidad que nos define desde el primer día.' },
  { icon: 'cart-outline' as const, titulo: 'Mayorista y autoservicio', desc: 'Comprá por cantidad o elegí tu corte en el local.' },
  { icon: 'people-outline' as const, titulo: 'Atención directa', desc: 'Te asesoramos para que elijas el corte justo que necesitás.' },
  { icon: 'time-outline' as const, titulo: 'Frescura garantizada', desc: 'Trabajamos con stock e ingresos controlados día a día.' },
];

function abrirUrl(url: string) {
  Linking.openURL(url).catch(() => {});
}

export default function LandingPage() {
  const { width } = useWindowDimensions();
  const ancho = width < 700 ? '100%' : width < 1000 ? '47%' : '30%';

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Nav */}
        <View style={styles.nav}>
          <View style={styles.navMarca}>
            <View style={styles.navBadge}>
              <Image
                source={require('@/assets/images/logo-don-ramon.jpg')}
                style={styles.navLogo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.navTexto}>Don Ramón</Text>
          </View>
          <Pressable style={styles.navBoton} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.navBotonTexto}>Iniciar sesión</Text>
          </Pressable>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Image
              source={require('@/assets/images/logo-don-ramon.jpg')}
              style={styles.heroLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.heroTitulo}>Frigorífico Don Ramón</Text>
          <Text style={styles.heroTagline}>Calidad en carnes desde siempre 🔥</Text>
          <Text style={styles.heroSub}>Venta mayorista & autoservicio</Text>
          <View style={styles.heroBotones}>
            <Pressable style={styles.botonPrimario} onPress={() => abrirUrl(INSTAGRAM_URL)}>
              <Ionicons name="logo-instagram" size={18} color={COLORS.negro} />
              <Text style={styles.botonPrimarioTexto}>Seguinos en Instagram</Text>
            </Pressable>
            <Pressable
              style={styles.botonSecundario}
              onPress={() => abrirUrl(`https://wa.me/549${TELEFONO_1}`)}
            >
              <Ionicons name="logo-whatsapp" size={18} color={COLORS.dorado} />
              <Text style={styles.botonSecundarioTexto}>Hacer un pedido</Text>
            </Pressable>
          </View>
        </View>

        {/* Quiénes somos */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Quiénes somos</Text>
          <Text style={styles.parrafo}>
            Somos un frigorífico de trayectoria, dedicado a ofrecer carne vacuna, de cerdo y de toro de la
            mejor calidad. Trabajamos tanto la venta mayorista como el autoservicio, para que vecinos,
            comercios y restaurantes encuentren siempre el corte justo que necesitan, con la frescura y la
            atención de un negocio de confianza.
          </Text>
        </View>

        {/* Productos */}
        <View style={[styles.seccion, styles.seccionOscura]}>
          <Text style={[styles.seccionTitulo, styles.seccionTituloClaro]}>Nuestros productos</Text>
          <View style={styles.grid}>
            {PRODUCTOS.map((p) => (
              <View key={p.titulo} style={[styles.tarjeta, { width: ancho }]}>
                <View style={styles.tarjetaIcono}>
                  <Ionicons name={p.icon} size={26} color={COLORS.dorado} />
                </View>
                <Text style={styles.tarjetaTitulo}>{p.titulo}</Text>
                <Text style={styles.tarjetaDesc}>{p.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Beneficios */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Por qué elegirnos</Text>
          <View style={styles.grid}>
            {BENEFICIOS.map((b) => (
              <View key={b.titulo} style={[styles.tarjetaClara, { width: ancho }]}>
                <Ionicons name={b.icon} size={24} color={COLORS.doradoOscuro} />
                <Text style={styles.tarjetaClaraTitulo}>{b.titulo}</Text>
                <Text style={styles.tarjetaClaraDesc}>{b.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Contacto */}
        <View style={[styles.seccion, styles.seccionOscura]}>
          <Text style={[styles.seccionTitulo, styles.seccionTituloClaro]}>Visitanos o hacé tu pedido</Text>
          <View style={styles.contactoFila}>
            <Ionicons name="location-outline" size={20} color={COLORS.dorado} />
            <Text style={styles.contactoTexto}>{DIRECCION}</Text>
          </View>
          <Pressable style={styles.contactoFila} onPress={() => abrirUrl(`tel:${TELEFONO_1}`)}>
            <Ionicons name="call-outline" size={20} color={COLORS.dorado} />
            <Text style={styles.contactoTexto}>{TELEFONO_1} (mayorista)</Text>
          </Pressable>
          <Pressable style={styles.contactoFila} onPress={() => abrirUrl(`tel:${TELEFONO_2}`)}>
            <Ionicons name="call-outline" size={20} color={COLORS.dorado} />
            <Text style={styles.contactoTexto}>{TELEFONO_2} (mayorista)</Text>
          </Pressable>
          <Pressable style={styles.contactoFila} onPress={() => abrirUrl(INSTAGRAM_URL)}>
            <Ionicons name="logo-instagram" size={20} color={COLORS.dorado} />
            <Text style={styles.contactoTexto}>@donramonfrigorifico</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTexto}>© {new Date().getFullYear()} Frigorífico Don Ramón</Text>
          <Pressable onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.footerLink}>Acceso interno</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.crema, ...(Platform.OS === 'web' ? { height: '100%' as const } : null) },
  scroll: { flexGrow: 1 },

  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.negro,
  },
  navMarca: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  navBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.crema,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.dorado,
  },
  navLogo: { width: 30, height: 30 },
  navTexto: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: COLORS.dorado },
  navBoton: { borderWidth: 1.5, borderColor: COLORS.dorado, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  navBotonTexto: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.dorado },

  hero: {
    backgroundColor: COLORS.negro,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 56,
    gap: 6,
  },
  heroBadge: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: COLORS.crema,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.dorado,
    marginBottom: 12,
  },
  heroLogo: { width: 96, height: 96 },
  heroTitulo: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 34,
    color: COLORS.dorado,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  heroTagline: { fontFamily: 'Poppins_600SemiBold', fontSize: 17, color: COLORS.doradoClaro, textAlign: 'center' },
  heroSub: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 14 },
  heroBotones: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  botonPrimario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.dorado,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  botonPrimarioTexto: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: COLORS.negro },
  botonSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.dorado,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  botonSecundarioTexto: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: COLORS.dorado },

  seccion: { paddingHorizontal: 24, paddingVertical: 48, gap: 16, alignItems: 'center' },
  seccionOscura: { backgroundColor: COLORS.negro },
  seccionTitulo: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: COLORS.grisTexto,
    textAlign: 'center',
    marginBottom: 4,
  },
  seccionTituloClaro: { color: COLORS.dorado },
  parrafo: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.grisSecundario,
    textAlign: 'center',
    maxWidth: 720,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, width: '100%', maxWidth: 1000 },
  tarjeta: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(201,162,75,0.3)',
    borderRadius: 16,
    padding: 18,
    gap: 8,
    minWidth: 220,
  },
  tarjetaIcono: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(201,162,75,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarjetaTitulo: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: COLORS.doradoClaro },
  tarjetaDesc: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 19 },

  tarjetaClara: {
    backgroundColor: COLORS.blanco,
    borderRadius: 16,
    padding: 18,
    gap: 8,
    minWidth: 220,
    shadowColor: COLORS.negro,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  tarjetaClaraTitulo: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: COLORS.grisTexto },
  tarjetaClaraDesc: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.grisSecundario, lineHeight: 19 },

  contactoFila: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contactoTexto: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: COLORS.crema },

  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.negroProfundo,
  },
  footerTexto: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  footerLink: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: COLORS.dorado },
});
