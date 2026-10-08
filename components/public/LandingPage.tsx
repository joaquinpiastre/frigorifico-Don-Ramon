import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef } from "react";
import {
  Image,
  ImageBackground,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { COLORS } from "@/constants/colors";

const INSTAGRAM_URL = "https://www.instagram.com/donramonfrigorifico/";
const TELEFONO_1 = "2604578682";
const TELEFONO_2 = "2604818210";
const DIRECCION = "Espínola 589, San Rafael, Mendoza";
const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Esp%C3%ADnola+589+San+Rafael+Mendoza";
const WHATSAPP_URL = `https://wa.me/549${TELEFONO_1}?text=${encodeURIComponent(
  "Hola! Quiero hacer un pedido.",
)}`;

const FOTOS = {
  vacuno1: require("@/assets/landing/vacuno-1.jpg"),
  vacuno2: require("@/assets/landing/vacuno-2.jpg"),
  vacuno3: require("@/assets/landing/vacuno-3.jpg"),
  vacuno4: require("@/assets/landing/vacuno-4.jpg"),
  vacuno5: require("@/assets/landing/vacuno-5.jpg"),
  vacuno6: require("@/assets/landing/vacuno-6.jpg"),
  vacuno7: require("@/assets/landing/vacuno-7.jpg"),
  vacuno8: require("@/assets/landing/vacuno-8.jpg"),
  cerdo1: require("@/assets/landing/cerdo-1.jpg"),
  cerdo2: require("@/assets/landing/cerdo-2.jpg"),
  cerdo3: require("@/assets/landing/cerdo-3.jpg"),
  cerdo4: require("@/assets/landing/cerdo-4.jpg"),
  pollo1: require("@/assets/landing/pollo-1.jpg"),
  pollo2: require("@/assets/landing/pollo-2.jpg"),
  pollo3: require("@/assets/landing/pollo-3.jpg"),
  embutidos1: require("@/assets/landing/embutidos-1.jpg"),
  embutidos2: require("@/assets/landing/embutidos-2.jpg"),
  embutidos3: require("@/assets/landing/embutidos-3.jpg"),
  embutidos4: require("@/assets/landing/embutidos-4.jpg"),
  milanesas1: require("@/assets/landing/milanesas-1.jpg"),
  milanesas2: require("@/assets/landing/milanesas-2.jpg"),
  milanesas3: require("@/assets/landing/milanesas-3.jpg"),
  picada: require("@/assets/landing/picada.jpg"),
  corte1: require("@/assets/landing/corte-1.jpg"),
};

const LOGO = require("@/assets/images/logo-don-ramon.jpg");

const PRODUCTOS = [
  {
    titulo: "Vacuno",
    desc: "Cortes de res seleccionados: asado, matambre, bifes y más.",
    foto: FOTOS.vacuno1,
  },
  {
    titulo: "Cerdo",
    desc: "Costillares, bondiola y cortes frescos para cada ocasión.",
    foto: FOTOS.cerdo1,
  },
  {
    titulo: "Pollo",
    desc: "Pollo entero, pata muslo y pechuga, siempre fresco.",
    foto: FOTOS.pollo1,
  },
  {
    titulo: "Embutidos",
    desc: "Chorizos, morcillas y salchichas de elaboración propia.",
    foto: FOTOS.embutidos1,
  },
  {
    titulo: "Milanesas y elaborados",
    desc: "Milanesas listas para freír u hornear, de carne y de pollo.",
    foto: FOTOS.milanesas1,
  },
  {
    titulo: "Carne picada",
    desc: "Picada fresca del día, para mayoristas y para tu mesa.",
    foto: FOTOS.picada,
  },
];

const GALERIA = [
  FOTOS.vacuno2,
  FOTOS.embutidos4,
  FOTOS.cerdo3,
  FOTOS.vacuno3,
  FOTOS.pollo2,
  FOTOS.vacuno4,
  FOTOS.embutidos2,
  FOTOS.milanesas2,
  FOTOS.cerdo2,
  FOTOS.vacuno5,
  FOTOS.embutidos3,
  FOTOS.vacuno6,
];

const BENEFICIOS = [
  {
    icon: "ribbon-outline" as const,
    titulo: "Calidad de siempre",
    desc: "La misma calidad que nos define desde el primer día.",
  },
  {
    icon: "cart-outline" as const,
    titulo: "Mayorista y autoservicio",
    desc: "Comprá por cantidad o elegí tu corte en el local.",
  },
  {
    icon: "people-outline" as const,
    titulo: "Atención directa",
    desc: "Te asesoramos para que elijas el corte justo que necesitás.",
  },
  {
    icon: "time-outline" as const,
    titulo: "Frescura garantizada",
    desc: "Trabajamos con stock e ingresos controlados día a día.",
  },
];

function abrirUrl(url: string) {
  Linking.openURL(url).catch(() => {});
}

function irAlLogin() {
  router.push("/(auth)/login");
}

type SeccionId = "productos" | "galeria" | "contacto";

export default function LandingPage() {
  const { width } = useWindowDimensions();
  const esEscritorio = width >= 900;
  const esCelu = width < 600;
  const scrollRef = useRef<ScrollView>(null);
  const posiciones = useRef<Partial<Record<SeccionId, number>>>({});

  const irA = (id: SeccionId) => {
    const y = posiciones.current[id];
    if (y !== undefined) scrollRef.current?.scrollTo({ y: y - 64, animated: true });
  };
  const marcar = (id: SeccionId) => (e: { nativeEvent: { layout: { y: number } } }) => {
    posiciones.current[id] = e.nativeEvent.layout.y;
  };

  const colsProductos = esEscritorio ? 3 : esCelu ? 1 : 2;
  const colsGaleria = esEscritorio ? 4 : esCelu ? 2 : 3;
  const maxContenido = 1120;
  const anchoContenido = Math.min(width - 48, maxContenido);
  const gap = 16;
  const anchoTarjeta = (anchoContenido - gap * (colsProductos - 1)) / colsProductos;
  const gapGaleria = 10;
  const anchoFoto =
    (anchoContenido - gapGaleria * (colsGaleria - 1)) / colsGaleria;

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
      >
        {/* Nav */}
        <View style={styles.nav}>
          <View style={styles.navInner}>
            <View style={styles.navMarca}>
              <View style={styles.navBadge}>
                <Image source={LOGO} style={styles.navLogo} resizeMode="contain" />
              </View>
              <Text style={styles.navTexto}>Don Ramón</Text>
            </View>
            <View style={styles.navLinks}>
              {esEscritorio && (
                <>
                  <Pressable onPress={() => irA("productos")}>
                    <Text style={styles.navLink}>Productos</Text>
                  </Pressable>
                  <Pressable onPress={() => irA("galeria")}>
                    <Text style={styles.navLink}>Galería</Text>
                  </Pressable>
                  <Pressable onPress={() => irA("contacto")}>
                    <Text style={styles.navLink}>Contacto</Text>
                  </Pressable>
                </>
              )}
              <Pressable style={styles.navBoton} onPress={irAlLogin}>
                <Text style={styles.navBotonTexto}>Iniciar sesión</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Hero */}
        <ImageBackground
          source={FOTOS.vacuno1}
          style={[styles.hero, esEscritorio && styles.heroGrande]}
          imageStyle={styles.heroImagen}
        >
          <View style={styles.heroVelo} />
          <View style={styles.heroContenido}>
            <View style={styles.heroBadge}>
              <Image source={LOGO} style={styles.heroLogo} resizeMode="contain" />
            </View>
            <Text style={[styles.heroTitulo, esCelu && { fontSize: 34 }]}>
              Frigorífico Don Ramón
            </Text>
            <Text style={styles.heroTagline}>
              Calidad en carnes desde siempre
            </Text>
            <Text style={styles.heroSub}>
              Venta mayorista y autoservicio · San Rafael, Mendoza
            </Text>
            <View style={styles.heroBotones}>
              <Pressable
                style={styles.botonPrimario}
                onPress={() => abrirUrl(WHATSAPP_URL)}
              >
                <Ionicons name="logo-whatsapp" size={18} color={COLORS.negro} />
                <Text style={styles.botonPrimarioTexto}>Hacer un pedido</Text>
              </Pressable>
              <Pressable
                style={styles.botonSecundario}
                onPress={() => irA("productos")}
              >
                <Text style={styles.botonSecundarioTexto}>Ver productos</Text>
                <Ionicons name="arrow-down" size={16} color={COLORS.dorado} />
              </Pressable>
            </View>
          </View>
        </ImageBackground>

        {/* Franja de datos */}
        <View style={styles.franja}>
          <View style={[styles.franjaInner, { maxWidth: maxContenido }]}>
            {[
              { icon: "ribbon-outline" as const, t: "Calidad 100%" },
              { icon: "cart-outline" as const, t: "Mayorista y autoservicio" },
              { icon: "snow-outline" as const, t: "Siempre fresco" },
            ].map((d) => (
              <View key={d.t} style={styles.franjaItem}>
                <Ionicons name={d.icon} size={20} color={COLORS.dorado} />
                <Text style={styles.franjaTexto}>{d.t}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quiénes somos */}
        <View style={styles.seccion}>
          <View
            style={[
              styles.nosotros,
              { maxWidth: maxContenido },
              esEscritorio && styles.nosotrosFila,
            ]}
          >
            <Image
              source={FOTOS.corte1}
              style={[
                styles.nosotrosFoto,
                esEscritorio ? { width: 440, height: 520 } : { width: "100%", height: 340 },
              ]}
              resizeMode="cover"
            />
            <View style={styles.nosotrosTexto}>
              <Text style={styles.etiqueta}>QUIÉNES SOMOS</Text>
              <Text style={[styles.titulo, styles.tituloIzq]}>
                Un frigorífico de confianza
              </Text>
              <Text style={[styles.parrafo, styles.parrafoIzq]}>
                Somos un frigorífico de trayectoria, dedicado a ofrecer carne
                vacuna, de cerdo y de pollo de la mejor calidad. Trabajamos tanto
                la venta mayorista como el autoservicio, para que vecinos,
                comercios y restaurantes encuentren siempre el corte justo que
                necesitan.
              </Text>
              <Text style={[styles.parrafo, styles.parrafoIzq]}>
                Cuidamos cada detalle, desde el ingreso de la media res hasta el
                mostrador, para que lo que llega a tu mesa sea fresco y de primera.
              </Text>
              <Pressable
                style={styles.enlaceFila}
                onPress={() => abrirUrl(INSTAGRAM_URL)}
              >
                <Ionicons name="logo-instagram" size={18} color={COLORS.doradoOscuro} />
                <Text style={styles.enlaceTexto}>@donramonfrigorifico</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Productos */}
        <View
          style={[styles.seccion, styles.seccionOscura]}
          onLayout={marcar("productos")}
        >
          <Text style={styles.etiqueta}>NUESTROS PRODUCTOS</Text>
          <Text style={[styles.titulo, styles.tituloClaro]}>
            Todo lo que necesitás, en un solo lugar
          </Text>
          <View style={[styles.grid, { width: anchoContenido, gap }]}>
            {PRODUCTOS.map((p) => (
              <View key={p.titulo} style={[styles.tarjeta, { width: anchoTarjeta }]}>
                <Image source={p.foto} style={styles.tarjetaFoto} resizeMode="cover" />
                <View style={styles.tarjetaVelo} />
                <View style={styles.tarjetaTextos}>
                  <Text style={styles.tarjetaTitulo}>{p.titulo}</Text>
                  <Text style={styles.tarjetaDesc}>{p.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Galería */}
        <View style={styles.seccion} onLayout={marcar("galeria")}>
          <Text style={styles.etiqueta}>GALERÍA</Text>
          <Text style={styles.titulo}>Mirá lo que hay en el mostrador</Text>
          <View style={[styles.grid, { width: anchoContenido, gap: gapGaleria }]}>
            {GALERIA.map((foto, i) => (
              <Image
                key={i}
                source={foto}
                style={[styles.galeriaFoto, { width: anchoFoto, height: anchoFoto * 1.2 }]}
                resizeMode="cover"
              />
            ))}
          </View>
        </View>

        {/* Beneficios */}
        <View style={[styles.seccion, styles.seccionClara]}>
          <Text style={styles.etiqueta}>POR QUÉ ELEGIRNOS</Text>
          <Text style={styles.titulo}>La diferencia se nota en la mesa</Text>
          <View style={[styles.grid, { width: anchoContenido, gap }]}>
            {BENEFICIOS.map((b) => (
              <View
                key={b.titulo}
                style={[
                  styles.tarjetaClara,
                  {
                    width: esEscritorio
                      ? (anchoContenido - gap * 3) / 4
                      : esCelu
                        ? anchoContenido
                        : (anchoContenido - gap) / 2,
                  },
                ]}
              >
                <View style={styles.beneficioIcono}>
                  <Ionicons name={b.icon} size={24} color={COLORS.doradoOscuro} />
                </View>
                <Text style={styles.tarjetaClaraTitulo}>{b.titulo}</Text>
                <Text style={styles.tarjetaClaraDesc}>{b.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <ImageBackground
          source={FOTOS.vacuno7}
          style={styles.cta}
          imageStyle={styles.heroImagen}
        >
          <View style={styles.heroVelo} />
          <View style={styles.ctaContenido}>
            <Text style={[styles.titulo, styles.tituloClaro]}>
              ¿Querés hacer un pedido?
            </Text>
            <Text style={styles.ctaSub}>
              Escribinos por WhatsApp y te respondemos a la brevedad.
            </Text>
            <Pressable
              style={styles.botonPrimario}
              onPress={() => abrirUrl(WHATSAPP_URL)}
            >
              <Ionicons name="logo-whatsapp" size={18} color={COLORS.negro} />
              <Text style={styles.botonPrimarioTexto}>Escribir por WhatsApp</Text>
            </Pressable>
          </View>
        </ImageBackground>

        {/* Contacto */}
        <View
          style={[styles.seccion, styles.seccionOscura]}
          onLayout={marcar("contacto")}
        >
          <Text style={styles.etiqueta}>CONTACTO</Text>
          <Text style={[styles.titulo, styles.tituloClaro]}>
            Visitanos o hacé tu pedido
          </Text>
          <View style={styles.contactoCaja}>
            <Pressable style={styles.contactoFila} onPress={() => abrirUrl(MAPS_URL)}>
              <View style={styles.contactoIcono}>
                <Ionicons name="location-outline" size={20} color={COLORS.dorado} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactoTexto}>{DIRECCION}</Text>
                <Text style={styles.contactoPista}>Ver en el mapa</Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.contactoFila}
              onPress={() => abrirUrl(`tel:${TELEFONO_1}`)}
            >
              <View style={styles.contactoIcono}>
                <Ionicons name="call-outline" size={20} color={COLORS.dorado} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactoTexto}>{TELEFONO_1}</Text>
                <Text style={styles.contactoPista}>Mayorista</Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.contactoFila}
              onPress={() => abrirUrl(`tel:${TELEFONO_2}`)}
            >
              <View style={styles.contactoIcono}>
                <Ionicons name="call-outline" size={20} color={COLORS.dorado} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactoTexto}>{TELEFONO_2}</Text>
                <Text style={styles.contactoPista}>Mayorista</Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.contactoFila}
              onPress={() => abrirUrl(INSTAGRAM_URL)}
            >
              <View style={styles.contactoIcono}>
                <Ionicons name="logo-instagram" size={20} color={COLORS.dorado} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactoTexto}>@donramonfrigorifico</Text>
                <Text style={styles.contactoPista}>Seguinos en Instagram</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Image source={LOGO} style={styles.footerLogo} resizeMode="contain" />
          <Text style={styles.footerTexto}>
            © {new Date().getFullYear()} Frigorífico Don Ramón
          </Text>
          <Pressable onPress={irAlLogin}>
            <Text style={styles.footerLink}>Acceso interno</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* WhatsApp flotante */}
      <Pressable style={styles.flotante} onPress={() => abrirUrl(WHATSAPP_URL)}>
        <Ionicons name="logo-whatsapp" size={28} color={COLORS.blanco} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.crema,
    ...(Platform.OS === "web" ? { height: "100%" as const } : null),
  },
  scroll: { flexGrow: 1 },

  nav: {
    backgroundColor: COLORS.negro,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(201,162,75,0.25)",
    zIndex: 10,
  },
  navInner: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  navMarca: { flexDirection: "row", alignItems: "center", gap: 10 },
  navBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.crema,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.dorado,
  },
  navLogo: { width: 32, height: 32 },
  navTexto: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: COLORS.dorado,
  },
  navLinks: { flexDirection: "row", alignItems: "center", gap: 24 },
  navLink: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: COLORS.crema,
  },
  navBoton: {
    borderWidth: 1.5,
    borderColor: COLORS.dorado,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  navBotonTexto: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.dorado,
  },

  hero: {
    minHeight: 520,
    justifyContent: "center",
    backgroundColor: COLORS.negro,
  },
  heroGrande: { minHeight: 640 },
  heroImagen: { opacity: 1 },
  heroVelo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11,10,8,0.68)",
  },
  heroContenido: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 64,
    gap: 8,
  },
  heroBadge: {
    width: 112,
    height: 112,
    borderRadius: 28,
    backgroundColor: COLORS.crema,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: COLORS.dorado,
    marginBottom: 14,
  },
  heroLogo: { width: 98, height: 98 },
  heroTitulo: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 48,
    color: COLORS.dorado,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  heroTagline: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: COLORS.doradoClaro,
    textAlign: "center",
  },
  heroSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginBottom: 18,
  },
  heroBotones: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  botonPrimario: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.dorado,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
  },
  botonPrimarioTexto: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: COLORS.negro,
  },
  botonSecundario: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.dorado,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
  },
  botonSecundarioTexto: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: COLORS.dorado,
  },

  franja: {
    backgroundColor: COLORS.negroProfundo,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  franjaInner: {
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    gap: 14,
  },
  franjaItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  franjaTexto: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: COLORS.crema,
  },

  seccion: {
    paddingHorizontal: 24,
    paddingVertical: 72,
    gap: 14,
    alignItems: "center",
  },
  seccionOscura: { backgroundColor: COLORS.negro },
  seccionClara: { backgroundColor: COLORS.grisClaro },
  etiqueta: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    letterSpacing: 2,
    color: COLORS.doradoOscuro,
  },
  titulo: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 30,
    color: COLORS.grisTexto,
    textAlign: "center",
    marginBottom: 14,
    maxWidth: 720,
  },
  tituloIzq: { textAlign: "left", alignSelf: "flex-start" },
  tituloClaro: { color: COLORS.dorado },
  parrafo: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    lineHeight: 26,
    color: COLORS.grisSecundario,
    textAlign: "center",
    maxWidth: 720,
  },
  parrafoIzq: { textAlign: "left" },

  nosotros: { width: "100%", gap: 32, alignItems: "center" },
  nosotrosFila: { flexDirection: "row" },
  nosotrosFoto: { borderRadius: 24 },
  nosotrosTexto: { flex: 1, gap: 12, alignItems: "flex-start" },
  enlaceFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  enlaceTexto: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: COLORS.doradoOscuro,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  tarjeta: {
    height: 340,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: COLORS.negroProfundo,
    justifyContent: "flex-end",
    borderWidth: 1,
    borderColor: "rgba(201,162,75,0.3)",
  },
  tarjetaFoto: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  tarjetaVelo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11,10,8,0.35)",
  },
  tarjetaTextos: {
    padding: 18,
    gap: 4,
    backgroundColor: "rgba(11,10,8,0.78)",
  },
  tarjetaTitulo: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: COLORS.doradoClaro,
  },
  tarjetaDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 19,
  },

  galeriaFoto: { borderRadius: 14, backgroundColor: COLORS.grisClaro },

  tarjetaClara: {
    backgroundColor: COLORS.blanco,
    borderRadius: 18,
    padding: 22,
    gap: 8,
    shadowColor: COLORS.negro,
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  beneficioIcono: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(201,162,75,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  tarjetaClaraTitulo: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: COLORS.grisTexto,
  },
  tarjetaClaraDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: COLORS.grisSecundario,
    lineHeight: 20,
  },

  cta: { backgroundColor: COLORS.negro },
  ctaContenido: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 80,
    gap: 8,
  },
  ctaSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginBottom: 16,
  },

  contactoCaja: { width: "100%", maxWidth: 520, gap: 12 },
  contactoFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(201,162,75,0.25)",
    borderRadius: 16,
    padding: 14,
  },
  contactoIcono: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(201,162,75,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  contactoTexto: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: COLORS.crema,
  },
  contactoPista: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
  },

  footer: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.negroProfundo,
  },
  footerLogo: { width: 48, height: 48, borderRadius: 12 },
  footerTexto: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  footerLink: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: COLORS.dorado,
  },

  flotante: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
