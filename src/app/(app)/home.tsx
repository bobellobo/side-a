import { useAuth } from "@/lib/context/auth/authProvider";
import { runEff } from "@/lib/effect/runEffect";
import { AppError, formatAppError } from "@/lib/errors";
import { addAlbumIdForUser } from "@/lib/services/albums/albumsService";
import { DiscogsRelease } from "@/lib/services/discogs/discogs.types";
import { searchDiscogsReleases } from "@/lib/services/discogs/discogsService";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function HomeScreen() {
  const { session, signOut, status, lastEvent } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ReadonlyArray<DiscogsRelease>>([]);
  const [selectedDiscogsId, setSelectedDiscogsId] = useState<number | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<AppError | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<AppError | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const onSearch = async () => {
    if (!query.trim()) {
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    setSelectedDiscogsId(null);

    try {
      const nextResults = await runEff(searchDiscogsReleases({ query }));
      setResults(nextResults);
    } catch (error) {
      setResults([]);
      setSearchError(AppError.fromUnknown("Network", error, "Unable to search Discogs right now."));
    } finally {
      setSearchLoading(false);
    }
  };

  const onAddAlbum = async () => {
    if (!session?.user.id || !selectedDiscogsId) {
      return;
    }

    setSaveLoading(true);
    setSaveError(null);
    setSaveNotice(null);

    try {
      await runEff(
        addAlbumIdForUser({
          userId: session.user.id,
          discogsAlbumId: selectedDiscogsId,
        }),
      );
      setSaveNotice(`Album id ${selectedDiscogsId} is queued to be persisted.`);
    } catch (error) {
      setSaveError(AppError.fromUnknown("Database", error, "Unable to save album id right now."));
    } finally {
      setSaveLoading(false);
    }
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
            <Text className="text-center text-base font-semibold text-white">
              {searchLoading ? "Searching..." : "Search Discogs"}
            </Text>
          </Pressable>

          {searchError ? (
            <Text className="mt-3 text-sm text-rose-700">{formatAppError(searchError)}</Text>
          ) : null}
        </View>

        <View className="mt-4 rounded-2xl border border-slate-200 bg-slate-100 p-4">
          <Text className="text-xs uppercase tracking-widest text-slate-500">2. Pick one release</Text>
          {query.trim().length === 0 ? (
            <Text className="mt-2 text-sm text-slate-600">
              Enter a search term to see matching release cards.
            </Text>
          ) : results.length === 0 ? (
            <Text className="mt-2 text-sm text-slate-600">No local mock result for this term yet.</Text>
          ) : (
            <View className="mt-3 gap-3">
              {results.map((album) => {
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
              {saveLoading ? "Saving..." : "Add album id to user table"}
            </Text>
          </Pressable>

          {saveError ? (
            <Text className="mt-3 text-sm text-rose-700">{formatAppError(saveError)}</Text>
          ) : null}

          {saveNotice ? (
            <Text className="mt-3 text-sm text-emerald-700">{saveNotice}</Text>
          ) : null}
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
