import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TextInput,
    Pressable,
    Platform,
    FlatList,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT, Region } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Category = "food" | "sport" | "nature" | "culture" | "other";

type Place = {
    id: string;
    title: string;
    description: string;
    rating?: number;
    reviewsCount?: number;
    lat: number;
    lng: number;
    category: Category;
};

const LIMASSOL: Region = {
    latitude: 34.7071,
    longitude: 33.0226,
    latitudeDelta: 0.09,
    longitudeDelta: 0.09,
};

const CATEGORY_LABEL: Record<Category, string> = {
    food: "Food",
    sport: "Sport",
    nature: "Nature",
    culture: "Culture",
    other: "Other",
};

export default function MapScreen() {
    const places: Place[] = useMemo(
        () => [
            {
                id: "1",
                title: "Beach Club ABOBA",
                description: "Short description what is going on",
                rating: 4.9,
                reviewsCount: 101,
                lat: 34.6816,
                lng: 32.9995,
                category: "food",
            },
            {
                id: "2",
                title: "Basketball Court",
                description: "Nice public court, usually active evenings",
                rating: 4.6,
                reviewsCount: 32,
                lat: 34.7009,
                lng: 33.0412,
                category: "sport",
            },
            {
                id: "3",
                title: "Viewpoint Spot",
                description: "Sunset is great here",
                rating: 4.8,
                reviewsCount: 18,
                lat: 34.725,
                lng: 33.006,
                category: "nature",
            },
            {
                id: "4",
                title: "Small Gallery",
                description: "Local exhibitions on weekends",
                rating: 4.5,
                reviewsCount: 12,
                lat: 34.7079,
                lng: 33.0204,
                category: "culture",
            },
            {
                id: "5",
                title: "Hidden Spot",
                description: "Just a cool place someone marked",
                rating: 4.2,
                reviewsCount: 5,
                lat: 34.712,
                lng: 33.035,
                category: "other",
            },
        ],
        []
    );

    const [query, setQuery] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(places[0]?.id ?? null);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    const [activeCategories, setActiveCategories] = useState<Set<Category>>(
        () => new Set<Category>(["food", "sport", "nature", "culture", "other"])
    );

    const toggleCategory = (c: Category) => {
        setActiveCategories((prev) => {
            const next = new Set(prev);
            if (next.has(c)) next.delete(c);
            else next.add(c);
            if (next.size === 0) {
                return new Set<Category>(["food", "sport", "nature", "culture", "other"]);
            }
            return next;
        });
    };

    const filteredPlaces = useMemo(() => {
        const q = query.trim().toLowerCase();
        return places.filter((p) => {
            if (!activeCategories.has(p.category)) return false;
            if (!q) return true;
            return (
                p.title.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q)
            );
        });
    }, [places, query, activeCategories]);

    const selected = useMemo(
        () => filteredPlaces.find((p) => p.id === selectedId) ?? null,
        [filteredPlaces, selectedId]
    );

    useEffect(() => {
        if (selectedId && !filteredPlaces.some((p) => p.id === selectedId)) {
            setSelectedId(null);
        }
    }, [filteredPlaces, selectedId]);

    const categories: Category[] = ["food", "sport", "nature", "culture", "other"];

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <MapView
                    provider={PROVIDER_DEFAULT}
                    style={StyleSheet.absoluteFill}
                    initialRegion={LIMASSOL}
                    onPress={() => setSelectedId(null)}
                    showsUserLocation
                    showsMyLocationButton
                >
                    {filteredPlaces.map((p) => (
                        <Marker
                            key={p.id}
                            coordinate={{ latitude: p.lat, longitude: p.lng }}
                            onPress={() => setSelectedId(p.id)}
                        >
                            <View style={[styles.pin, selectedId === p.id && styles.pinActive]}>
                                <MaterialCommunityIcons
                                    name="map-marker"
                                    size={24}
                                    color={selectedId === p.id ? "#FFFFFF" : "#111111"}
                                />
                            </View>
                        </Marker>
                    ))}
                </MapView>

                {/* Filters button */}
                <Pressable
                    style={styles.filtersBar}
                    onPress={() => setIsFiltersOpen((v) => !v)}
                >
                    <Text style={styles.filtersText}>Filters</Text>
                    <MaterialCommunityIcons
                        name={isFiltersOpen ? "chevron-up" : "chevron-down"}
                        size={26}
                        color="#111"
                    />
                </Pressable>

                {isFiltersOpen && (
                    <View style={styles.filtersPanel}>
                        <View style={styles.chipsWrap}>
                            {categories.map((c) => {
                                const active = activeCategories.has(c);
                                return (
                                    <Pressable
                                        key={c}
                                        onPress={() => toggleCategory(c)}
                                        style={[styles.chip, active && styles.chipActive]}
                                    >
                                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                            {CATEGORY_LABEL[c]}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Search */}
                <View style={styles.searchWrap}>
                    <MaterialCommunityIcons name="magnify" size={22} color="#111" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search..."
                        placeholderTextColor="#6a6a6a"
                        value={query}
                        onChangeText={setQuery}
                    />
                </View>

                {/* Bottom card */}
                {selected && (
                    <View style={styles.bottomCard}>
                        <Text style={styles.cardTitle}>{selected.title}</Text>
                        <Text style={styles.cardDesc}>{selected.description}</Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#fff" },
    container: { flex: 1 },

    pin: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#111",
        alignItems: "center",
        justifyContent: "center",
    },
    pinActive: { backgroundColor: "#111" },

    filtersBar: {
        position: "absolute",
        top: Platform.OS === "ios" ? 20 : 10,
        left: 18,
        right: 18,
        height: 50,
        borderRadius: 16,
        backgroundColor: "#8FB4B2",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        justifyContent: "space-between",
    },
    filtersText: { fontSize: 18, fontWeight: "800" },

    filtersPanel: {
        position: "absolute",
        top: Platform.OS === "ios" ? 80 : 70,
        left: 18,
        right: 18,
        padding: 12,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.95)",
    },

    chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

    chip: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#ccc",
    },
    chipActive: { backgroundColor: "#111" },

    chipText: { fontWeight: "700" },
    chipTextActive: { color: "#fff" },

    searchWrap: {
        position: "absolute",
        left: 18,
        right: 18,
        bottom: 100,
        height: 50,
        borderRadius: 16,
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#e6e6e6",
    },
    searchInput: { flex: 1, fontSize: 16 },

    bottomCard: {
        position: "absolute",
        left: 18,
        right: 18,
        bottom: 160,
        padding: 14,
        borderRadius: 16,
        backgroundColor: "#E6E6E6",
    },
    cardTitle: { fontSize: 16, fontWeight: "900" },
    cardDesc: { marginTop: 4, fontSize: 13 },
});
