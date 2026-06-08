import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "./src/components/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./src/components/Card";
import Input from "./src/components/Input";

const DICTIONARY_API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en";

type DictionaryPhonetic = {
  text?: string;
  audio?: string;
  sourceUrl?: string;
};

type DictionaryDefinition = {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
};

type DictionaryMeaning = {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
};

type DictionaryEntry = {
  word: string;
  phonetic?: string;
  phonetics?: DictionaryPhonetic[];
  meanings?: DictionaryMeaning[];
};

type AudioOption = {
  label: string;
  phoneticText?: string;
  url: string;
};

function getFriendlyError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) {
      return "Word not found. Check the spelling and try another word.";
    }

    if (!error.response) {
      return "Network error. Please check your connection and try again.";
    }

    return "The dictionary service could not complete this request. Please try again.";
  }

  return "Something went wrong while loading the word. Please try again.";
}

function getAudioRegion(url: string) {
  const normalized = url.toLowerCase();

  if (normalized.includes("-us") || normalized.includes("us.mp3")) {
    return "US";
  }

  if (normalized.includes("-uk") || normalized.includes("uk.mp3")) {
    return "UK";
  }

  return "Audio";
}

function normalizeAudioUrl(url: string) {
  const trimmedUrl = url.trim();

  if (trimmedUrl.startsWith("//")) {
    return `https:${trimmedUrl}`;
  }

  if (trimmedUrl.startsWith("http://")) {
    return trimmedUrl.replace("http://", "https://");
  }

  return trimmedUrl;
}

function getAudioOptions(phonetics: DictionaryPhonetic[]) {
  const options = new Map<string, AudioOption>();

  phonetics.forEach((phonetic, index) => {
    const url = normalizeAudioUrl(phonetic.audio ?? "");

    if (!url || options.has(url)) {
      return;
    }

    const region = getAudioRegion(url);
    const phoneticText = phonetic.text?.trim();
    const fallbackLabel = region === "Audio" ? `Audio ${index + 1}` : region;

    options.set(url, {
      label: phoneticText ? `${fallbackLabel} ${phoneticText}` : fallbackLabel,
      phoneticText,
      url
    });
  });

  return [...options.values()];
}

function getPlainJsonPreview(value: unknown) {
  return JSON.stringify(value, null, 2)
    .replace(/"([^"]+)":/g, "$1:")
    .replace(/"/g, "");
}

export default function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [inputError, setInputError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedAudioIndex, setSelectedAudioIndex] = useState(0);
  const [playbackMessage, setPlaybackMessage] = useState("");

  const entry = entries[0];
  const allPhonetics = useMemo(() => entries.flatMap((wordEntry) => wordEntry.phonetics ?? []), [entries]);
  const allMeanings = useMemo(() => entries.flatMap((wordEntry) => wordEntry.meanings ?? []), [entries]);
  const phoneticText =
    entry?.phonetic || allPhonetics.find((phonetic) => phonetic.text)?.text || "";
  const audioOptions = useMemo(() => getAudioOptions(allPhonetics), [allPhonetics]);
  const selectedAudioUrl = audioOptions[selectedAudioIndex]?.url ?? null;
  const audioPlayer = useAudioPlayer(selectedAudioUrl, { updateInterval: 250 });
  const audioStatus = useAudioPlayerStatus(audioPlayer);
  const phoneticsPreview = useMemo(
    () =>
      getPlainJsonPreview(
        allPhonetics.map((phonetic) => ({
          text: phonetic.text || null,
          audio: normalizeAudioUrl(phonetic.audio ?? "") || null
        }))
      ),
    [allPhonetics]
  );

  useEffect(() => {
    setAudioModeAsync({
      interruptionMode: "duckOthers",
      playsInSilentMode: true,
      shouldRouteThroughEarpiece: false
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    setPlaybackMessage("");
  }, [selectedAudioUrl]);

  async function searchWord(wordToSearch = searchTerm) {
    const cleanedWord = wordToSearch.trim();

    if (!cleanedWord) {
      setInputError("Enter an English word to search.");
      setErrorMessage("");
      return;
    }

    Keyboard.dismiss();
    setInputError("");
    setErrorMessage("");
    setPlaybackMessage("");
    setIsLoading(true);
    setSelectedAudioIndex(0);

    try {
      audioPlayer.pause();
      await audioPlayer.seekTo(0).catch(() => undefined);
      const requestUrl = `${DICTIONARY_API_URL}/${encodeURIComponent(cleanedWord.toLowerCase())}`;
      const response = await axios.get<DictionaryEntry[]>(requestUrl);
      const nextEntries = Array.isArray(response.data) ? response.data : [];

      if (!nextEntries.length) {
        setEntries([]);
        setErrorMessage("No dictionary data was returned for this word.");
        return;
      }

      const resolvedWord = nextEntries[0]?.word || cleanedWord;
      setEntries(nextEntries);
      setSearchTerm(resolvedWord);
      setHistory((currentHistory) => {
        const withoutDuplicate = currentHistory.filter(
          (historyWord) => historyWord.toLowerCase() !== resolvedWord.toLowerCase()
        );

        return [resolvedWord, ...withoutDuplicate].slice(0, 12);
      });
    } catch (error) {
      setEntries([]);
      setErrorMessage(getFriendlyError(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleAudioPlayback() {
    if (!selectedAudioUrl) {
      return;
    }

    setPlaybackMessage("");

    if (audioStatus.playing) {
      audioPlayer.pause();
      return;
    }

    if (audioStatus.error) {
      setPlaybackMessage("This pronunciation audio could not be loaded. Try another audio option.");
      return;
    }

    if (audioStatus.didJustFinish || (audioStatus.duration > 0 && audioStatus.currentTime >= audioStatus.duration)) {
      await audioPlayer.seekTo(0).catch(() => undefined);
    }

    try {
      audioPlayer.play();
    } catch {
      setPlaybackMessage("Audio playback failed. Try another word or audio option.");
    }
  }

  async function stopAudioPlayback() {
    audioPlayer.pause();
    await audioPlayer.seekTo(0).catch(() => undefined);
  }

  async function selectAudio(index: number) {
    setSelectedAudioIndex(index);
    setPlaybackMessage("");
    audioPlayer.pause();
    await audioPlayer.seekTo(0).catch(() => undefined);
  }

  function renderEmptyState() {
    if (isLoading) {
      return (
        <Card>
          <CardContent style={styles.loadingState}>
            <ActivityIndicator color="#1d4ed8" size="large" />
            <Text style={styles.mutedText}>Searching the dictionary...</Text>
          </CardContent>
        </Card>
      );
    }

    if (errorMessage) {
      return (
        <Card style={styles.feedbackCard}>
          <CardContent style={styles.feedbackContent}>
            <Ionicons name="alert-circle-outline" size={34} color="#b91c1c" />
            <Text style={styles.feedbackTitle}>{errorMessage}</Text>
            <Button disabled={!searchTerm.trim()} onPress={() => searchWord()}>
              Retry search
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (!entry) {
      return (
        <Card>
          <CardContent style={styles.feedbackContent}>
            <Ionicons name="book-outline" size={34} color="#1d4ed8" />
            <Text style={styles.feedbackTitle}>Search a word to view meanings and examples.</Text>
          </CardContent>
        </Card>
      );
    }

    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <Modal animationType="fade" transparent visible={isDrawerOpen} onRequestClose={() => setIsDrawerOpen(false)}>
        <View style={styles.drawerOverlay}>
          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <View>
                <Text style={styles.eyebrow}>Navigation</Text>
                <Text style={styles.drawerTitle}>Search History</Text>
              </View>
              <Pressable accessibilityRole="button" style={styles.iconButton} onPress={() => setIsDrawerOpen(false)}>
                <Ionicons name="close" size={22} color="#111827" />
              </Pressable>
            </View>

            {history.length ? (
              <ScrollView contentContainerStyle={styles.historyList}>
                {history.map((historyWord) => (
                  <Pressable
                    accessibilityRole="button"
                    key={historyWord.toLowerCase()}
                    style={styles.historyItem}
                    onPress={() => {
                      setIsDrawerOpen(false);
                      searchWord(historyWord);
                    }}
                  >
                    <Ionicons name="time-outline" size={19} color="#0f766e" />
                    <Text style={styles.historyWord}>{historyWord}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.drawerEmpty}>
                <Text style={styles.mutedText}>Your successful searches will appear here.</Text>
              </View>
            )}
          </View>
          <Pressable style={styles.drawerScrim} onPress={() => setIsDrawerOpen(false)} />
        </View>
      </Modal>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.shell}>
        <View style={styles.topbar}>
          <Pressable accessibilityRole="button" style={styles.iconButton} onPress={() => setIsDrawerOpen(true)}>
            <Ionicons name="menu" size={24} color="#111827" />
          </Pressable>
          <View style={styles.brandBlock}>
            <Text style={styles.eyebrow}>LexiTech Dictionary</Text>
            <Text style={styles.title}>Find English meanings fast</Text>
          </View>
        </View>

        <Card>
          <CardHeader>
            <CardTitle>Word Search</CardTitle>
          </CardHeader>
          <CardContent style={styles.searchForm}>
            <Input
              autoCapitalize="none"
              autoCorrect={false}
              error={inputError}
              label="English word"
              placeholder="Example: innovation"
              returnKeyType="search"
              value={searchTerm}
              onChangeText={(text) => {
                setSearchTerm(text);
                if (inputError) {
                  setInputError("");
                }
              }}
              onSubmitEditing={() => searchWord()}
            />
            <Button disabled={!searchTerm.trim()} isLoading={isLoading} onPress={() => searchWord()}>
              Search
            </Button>
          </CardContent>
        </Card>

        {renderEmptyState()}

        {entry ? (
          <View style={styles.results}>
            <Card>
              <CardContent style={styles.wordHeader}>
                <View style={styles.wordTitleBlock}>
                  <Text style={styles.word}>{entry.word}</Text>
                  {phoneticText ? <Text style={styles.phonetic}>{phoneticText}</Text> : null}
                </View>

                {selectedAudioUrl ? (
                  <View style={styles.audioPanel}>
                    <View style={styles.audioButtons}>
                      <Pressable accessibilityRole="button" style={styles.audioButton} onPress={toggleAudioPlayback}>
                        <Ionicons
                          name={audioStatus.playing ? "pause" : "volume-high-outline"}
                          size={22}
                          color="#ffffff"
                        />
                      </Pressable>
                      <Pressable accessibilityRole="button" style={styles.stopButton} onPress={stopAudioPlayback}>
                        <Ionicons name="stop" size={18} color="#0f172a" />
                      </Pressable>
                    </View>

                    {audioOptions.length > 1 ? (
                      <View style={styles.audioChoices}>
                        {audioOptions.map((option, index) => (
                          <Pressable
                            accessibilityRole="button"
                            key={option.url}
                            style={[styles.audioChoice, selectedAudioIndex === index && styles.audioChoiceActive]}
                            onPress={() => selectAudio(index)}
                          >
                            <Text
                              style={[
                                styles.audioChoiceText,
                                selectedAudioIndex === index && styles.audioChoiceTextActive
                              ]}
                            >
                              {option.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}

                    {playbackMessage || audioStatus.error ? (
                      <Text style={styles.audioError}>
                        {playbackMessage || "This pronunciation audio could not be loaded."}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </CardContent>
            </Card>

            {allPhonetics.length ? (
              <Card>
                <CardHeader>
                  <CardTitle>API Phonetics</CardTitle>
                </CardHeader>
                <CardContent>
                  <Text style={styles.apiPreview}>{phoneticsPreview}</Text>
                </CardContent>
              </Card>
            ) : null}

            {allMeanings.length ? (
              allMeanings.map((meaning, meaningIndex) => (
                <Card key={`${meaning.partOfSpeech}-${meaningIndex}`}>
                  <CardHeader>
                    <Text style={styles.partOfSpeech}>{meaning.partOfSpeech}</Text>
                  </CardHeader>
                  <CardContent style={styles.definitionList}>
                    {meaning.definitions.map((definition, definitionIndex) => (
                      <View key={`${definition.definition}-${definitionIndex}`} style={styles.definitionItem}>
                        <Text style={styles.definitionNumber}>{definitionIndex + 1}</Text>
                        <View style={styles.definitionTextBlock}>
                          <Text style={styles.definitionText}>{definition.definition}</Text>
                          {definition.example ? (
                            <Text style={styles.exampleText}>&quot;{definition.example}&quot;</Text>
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent style={styles.feedbackContent}>
                  <Text style={styles.feedbackTitle}>No definitions are available for this word.</Text>
                </CardContent>
              </Card>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#f5f7fb",
    flex: 1
  },
  shell: {
    gap: 16,
    padding: 18,
    paddingBottom: 34
  },
  topbar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  brandBlock: {
    flex: 1
  },
  eyebrow: {
    color: "#0f766e",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0,
    marginBottom: 4,
    textTransform: "uppercase"
  },
  title: {
    color: "#0f172a",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 34
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#dbe3ef",
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  searchForm: {
    gap: 14
  },
  loadingState: {
    alignItems: "center",
    gap: 12,
    paddingTop: 18
  },
  mutedText: {
    color: "#64748b",
    fontSize: 15,
    lineHeight: 21
  },
  feedbackCard: {
    borderColor: "#fecaca"
  },
  feedbackContent: {
    alignItems: "center",
    gap: 14,
    paddingTop: 18
  },
  feedbackTitle: {
    color: "#334155",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 23,
    textAlign: "center"
  },
  results: {
    gap: 16
  },
  wordHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
    paddingTop: 18
  },
  wordTitleBlock: {
    flex: 1,
    gap: 4
  },
  word: {
    color: "#0f172a",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "capitalize"
  },
  phonetic: {
    color: "#475569",
    fontSize: 17,
    fontWeight: "600"
  },
  audioPanel: {
    alignItems: "flex-end",
    gap: 10
  },
  audioButtons: {
    flexDirection: "row",
    gap: 8
  },
  audioButton: {
    alignItems: "center",
    backgroundColor: "#1d4ed8",
    borderRadius: 8,
    height: 46,
    justifyContent: "center",
    width: 46
  },
  stopButton: {
    alignItems: "center",
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
    height: 46,
    justifyContent: "center",
    width: 46
  },
  audioChoices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-end",
    maxWidth: 148
  },
  audioChoice: {
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  audioChoiceActive: {
    backgroundColor: "#ccfbf1"
  },
  audioChoiceText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "800"
  },
  audioChoiceTextActive: {
    color: "#0f766e"
  },
  audioError: {
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    maxWidth: 160,
    textAlign: "right"
  },
  apiPreview: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    color: "#334155",
    fontSize: 12,
    lineHeight: 18,
    padding: 12
  },
  partOfSpeech: {
    alignSelf: "flex-start",
    backgroundColor: "#eef2ff",
    borderRadius: 8,
    color: "#3730a3",
    fontSize: 15,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 7,
    textTransform: "capitalize"
  },
  definitionList: {
    gap: 16
  },
  definitionItem: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12
  },
  definitionNumber: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    color: "#0f766e",
    fontSize: 14,
    fontWeight: "900",
    minWidth: 30,
    overflow: "hidden",
    paddingVertical: 6,
    textAlign: "center"
  },
  definitionTextBlock: {
    flex: 1,
    gap: 8
  },
  definitionText: {
    color: "#1e293b",
    fontSize: 16,
    lineHeight: 24
  },
  exampleText: {
    color: "#64748b",
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 22
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: "row"
  },
  drawerScrim: {
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    flex: 1
  },
  drawer: {
    backgroundColor: "#ffffff",
    elevation: 12,
    height: "100%",
    padding: 18,
    shadowColor: "#0f172a",
    shadowOffset: { height: 0, width: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    width: 304
  },
  drawerHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 18
  },
  drawerTitle: {
    color: "#0f172a",
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: 0
  },
  historyList: {
    gap: 10,
    paddingBottom: 24
  },
  historyItem: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 12
  },
  historyWord: {
    color: "#0f172a",
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    textTransform: "capitalize"
  },
  drawerEmpty: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14
  }
});
