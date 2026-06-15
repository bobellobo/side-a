import { useAuth } from "@/lib/context/auth/authProvider";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

type SearchResult = {
  readonly discogsId: number;
  readonly title: string;
  readonly year: string;
  readonly country: string;
};

const mockDiscogsResults: ReadonlyArray<SearchResult> = [
  { discogsId: 1453365, title: "Daft Punk - Discovery", year: "2001", country: "France" },
  { discogsId: 1123778, title: "Nirvana - Nevermind", year: "1991", country: "US" },
  { discogsId: 2495040, title: "Kendrick Lamar - DAMN.", year: "2017", country: "US" },
];

export default function HomeScreen() {
  const { session, signOut, status, lastEvent } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedDiscogsId, setSelectedDiscogsId] = useState<number | null>(null);

  const filteredResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return mockDiscogsResults.filter((album) =>
      album.title.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  const onSearch = () => {
    // Future implementation: call Discogs API with the query and replace mock results.
  };

  const onAddAlbum = () => {
    // Future implementation: insert selectedDiscogsId into a user-owned Supabase table.
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="px-6 py-10">
      <View className="rounded-3xl border border-slate-200 bg-white p-6">
        <Text className="text-xs uppercase tracking-[2px] text-slate-500">Feature Scaffold</Text>
        <Text className="mt-2 text-3xl font-semibold text-slate-900">Search Album</Text>
        <Text className="mt-3 text-sm leading-6 text-slate-700">
          Signed in as {session?.user.email ?? "unknown user"}. This screen prepares the Discogs-to-
          Supabase workflow.
        </Text>

        <View className="mt-6 rounded-2xl border border-slate-200 bg-slate-100 p-4">
          <Text className="text-xs uppercase tracking-widest text-slate-500">1. Search Discogs</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            className="mt-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
            onChangeText={setQuery}
            placeholder="Try: Daft Punk, Nirvana, Kendrick Lamar"
            placeholderTextColor="#64748b"
            value={query}
          />

          <Pressable
            className={`mt-3 rounded-xl px-4 py-3 ${query.trim().length > 0 ? "bg-slate-900" : "bg-slate-400"}`}
            disabled={query.trim().length === 0}
            onPress={onSearch}
          >
            <Text className="text-center text-base font-semibold text-white">Search Discogs (planned)</Text>
          </Pressable>
        </View>

        <View className="mt-4 rounded-2xl border border-slate-200 bg-slate-100 p-4">
          <Text className="text-xs uppercase tracking-widest text-slate-500">2. Pick one release</Text>
          {query.trim().length === 0 ? (
            <Text className="mt-2 text-sm text-slate-600">
              Enter a search term to see matching release cards.
            </Text>
          ) : filteredResults.length === 0 ? (
            <Text className="mt-2 text-sm text-slate-600">No local mock result for this term yet.</Text>
          ) : (
            <View className="mt-3 gap-3">
              {filteredResults.map((album) => {
                const isSelected = selectedDiscogsId === album.discogsId;

                return (
                  <Pressable
                    key={album.discogsId}
                    className={`rounded-xl border px-4 py-3 ${isSelected ? "border-cyan-500 bg-cyan-50" : "border-slate-300 bg-white"}`}
                    onPress={() => setSelectedDiscogsId(album.discogsId)}
                  >
                    <Text className="text-base font-semibold text-slate-900">{album.title}</Text>
                    <Text className="mt-1 text-sm text-slate-700">Discogs id: {album.discogsId}</Text>
                    <Text className="text-sm text-slate-700">
                      {album.year} • {album.country}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View className="mt-4 rounded-2xl border border-slate-200 bg-slate-100 p-4">
          <Text className="text-xs uppercase tracking-widest text-slate-500">3. Save to Supabase</Text>
          <Text className="mt-2 text-sm text-slate-700">
            Selected album id: {selectedDiscogsId ?? "None"}
          </Text>
          <Pressable
            className={`mt-3 rounded-xl px-4 py-3 ${selectedDiscogsId ? "bg-cyan-500" : "bg-slate-400"}`}
            disabled={!selectedDiscogsId}
            onPress={onAddAlbum}
          >
            <Text className="text-center text-base font-semibold text-slate-900">
              Add album id to user table (planned)
            </Text>
          </Pressable>
        </View>

        <View className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <Text className="text-xs uppercase tracking-widest text-slate-500">Auth state</Text>
          <Text className="mt-1 text-sm text-slate-900">Status: {status}</Text>
          <Text className="mt-1 text-sm text-slate-900">Last event: {lastEvent ?? "None"}</Text>
        </View>

        <Pressable className="mt-6 rounded-xl bg-slate-900 px-4 py-3" onPress={signOut}>
          <Text className="text-center text-base font-semibold text-white">Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
