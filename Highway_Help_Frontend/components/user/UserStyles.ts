import { StyleSheet, Dimensions, Platform } from "react-native";
const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  // Global Layout
  headerContent: { padding: 24, paddingTop: 10 },
  sheetTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1A1C1E",
    letterSpacing: -0.5,
  },
  sheetSub: {
    fontSize: 15,
    color: "#6C757D",
    marginBottom: 24,
    fontWeight: "500",
  },

  // Input Section
  inputWrapper: {
    backgroundColor: "#F1F3F5",
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  textArea: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1A1A1A",
    height: 70,
    textAlignVertical: "top",
  },

  // Main Action Button
  mainBtn: {
    backgroundColor: "#2D5AF0",
    paddingVertical: 18,
    borderRadius: 22,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#2D5AF0",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  disabledBtn: { backgroundColor: "#CFD9FF", shadowOpacity: 0 },
  btnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 0.3,
  },
  searchingRow: { flexDirection: "row", alignItems: "center" },

  // Offers List
  offersHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 32,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  offersTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1C1E",
    marginRight: 10,
  },
  blueDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#00C853",
  },

  // Offer Card (Premium Look)
  offerCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#F1F3F5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  offerMain: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  avatarContainer: { position: "relative" },
  avatarCircle: {
    backgroundColor: "#F0F3FF",
    width: 60,
    height: 60,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  ratingBadge: {
    position: "absolute",
    bottom: -6,
    right: -6,
    backgroundColor: "#FFB800",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  ratingBadgeText: { color: "#FFF", fontSize: 11, fontWeight: "900" },
  mechanicDetails: { flex: 1, marginLeft: 16 },
  mechanicName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1C1E",
    marginBottom: 4,
  },
  infoRow: { flexDirection: "row", alignItems: "center" },
  distanceInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  infoText: { fontSize: 12, color: "#6C757D", fontWeight: "700" },
  dotSeparator: { marginHorizontal: 8, color: "#DEE2E6", fontSize: 18 },
  priceContainer: { alignItems: "flex-end" },
  currency: { fontSize: 14, fontWeight: "800", color: "#2D5AF0" },
  priceValue: { fontSize: 28, fontWeight: "900", color: "#1A1C1E" },

  // Accept Button
  acceptBtn: {
    backgroundColor: "#1A1C1E",
    paddingVertical: 16,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  acceptBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    marginRight: 8,
  },
  acceptBtnCircle: {
    backgroundColor: "#00C853",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  // Markers
  userMarkerContainer: { justifyContent: "center", alignItems: "center" },
  userMarkerCore: {
    width: 18,
    height: 18,
    backgroundColor: "#2D5AF0",
    borderRadius: 9,
    borderWidth: 3,
    borderColor: "#FFF",
  },
  userMarkerPulse: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(45, 90, 240, 0.2)",
    borderRadius: 20,
    position: "absolute",
  },
  mechMarker: {
    backgroundColor: "#1A1C1E",
    padding: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFF",
    elevation: 10,
  },

  // Rating Overlay
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 10, 10, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  ratingCard: {
    width: width * 0.88,
    backgroundColor: "#fff",
    borderRadius: 40,
    padding: 32,
    alignItems: "center",
  },
  ratingIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#00C853",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  ratingTitle: { fontSize: 24, fontWeight: "900", color: "#1A1C1E" },
  ratingSub: {
    fontSize: 16,
    color: "#6C757D",
    marginTop: 8,
    fontWeight: "500",
  },
  starsRow: { flexDirection: "row", marginVertical: 32 },
  submitBtn: {
    backgroundColor: "#2D5AF0",
    width: "100%",
    padding: 20,
    borderRadius: 24,
    alignItems: "center",
  },
  submitBtnText: { color: "#fff", fontWeight: "800", fontSize: 18 },

  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyText: {
    color: "#ADB5BD",
    fontWeight: "700",
    marginTop: 16,
    fontSize: 16,
  },
});

export const mapStyle = [
  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#dbe2f0" }],
  },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
];
