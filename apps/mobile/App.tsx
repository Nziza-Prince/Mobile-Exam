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
  const [showSourceData, setShowSourceData] = useState(false);

  const entry = entries[0];
  const allPhonetics = useMemo(() => entries.flatMap((wordEntry) => wordEntry.phonetics ?? []), [entries]);
  const allMeanings = useMemo(() => entries.flatMap((wordEntry) => wordEntry.meanings ?? []), [entries]);
  const definitionCount = useMemo(
    () => allMeanings.reduce((total, meaning) => total + meaning.definitions.length, 0),
    [allMeanings]
  );
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
    setShowSourceData(false);
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
            <Text style={styles.title}>Dictionary</Text>
          </View>
          {history.length ? (
            <View style={styles.historyBadge}>
              <Ionicons name="time-outline" size={16} color="#0f766e" />
              <Text style={styles.historyBadgeText}>{history.length}</Text>
            </View>
          ) : null}
        </View>

        <Card style={styles.searchCard}>
          <CardHeader>
            <CardTitle>Find a Word</CardTitle>
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
            <View style={styles.searchActions}>
              <View style={styles.searchButtonWrap}>
                <Button disabled={!searchTerm.trim()} isLoading={isLoading} onPress={() => searchWord()}>
                  Search
                </Button>
              </View>
              {searchTerm ? (
                <Pressable
                  accessibilityRole="button"
                  style={styles.clearButton}
                  onPress={() => {
                    setSearchTerm("");
                    setInputError("");
                    setErrorMessage("");
                    setEntries([]);
                    setPlaybackMessage("");
                  }}
                >
                  <Ionicons name="close-circle-outline" size={22} color="#475569" />
                </Pressable>
              ) : null}
            </View>
            {history.length ? (
              <View style={styles.recentSearches}>
                {history.slice(0, 4).map((historyWord) => (
                  <Pressable
                    accessibilityRole="button"
                    key={historyWord.toLowerCase()}
                    style={styles.recentChip}
                    onPress={() => searchWord(historyWord)}
                  >
                    <Text style={styles.recentChipText}>{historyWord}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </CardContent>
        </Card>

        {renderEmptyState()}

        {entry ? (
          <View style={styles.results}>
            <Card style={styles.wordCard}>
              <CardContent style={styles.wordHeader}>
                <View style={styles.wordTitleBlock}>
                  <Text style={styles.word}>{entry.word}</Text>
                  {phoneticText ? <Text style={styles.phonetic}>{phoneticText}</Text> : null}
                  <View style={styles.summaryChips}>
                    <View style={styles.summaryChip}>
                      <Text style={styles.summaryChipText}>{allMeanings.length} meanings</Text>
                    </View>
                    <View style={styles.summaryChip}>
                      <Text style={styles.summaryChipText}>{definitionCount} definitions</Text>
                    </View>
                    {audioOptions.length ? (
                      <View style={styles.summaryChip}>
                        <Text style={styles.summaryChipText}>{audioOptions.length} audio</Text>
                      </View>
                    ) : null}
                  </View>
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

                    {playbackMessage || audioStatus.error ? (
                      <Text style={styles.audioError}>
                        {playbackMessage || "This pronunciation audio could not be loaded."}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </CardContent>

              {audioOptions.length > 1 ? (
                <CardContent style={styles.pronunciationArea}>
                  <Text style={styles.sectionLabel}>Pronunciations</Text>
                  <View style={styles.audioChoices}>
                    {audioOptions.map((option, index) => (
                      <Pressable
                        accessibilityRole="button"
                        key={option.url}
                        style={[styles.audioChoice, selectedAudioIndex === index && styles.audioChoiceActive]}
                        onPress={() => selectAudio(index)}
                      >
                        <Ionicons
                          name={selectedAudioIndex === index ? "radio-button-on" : "radio-button-off"}
                          size={15}
                          color={selectedAudioIndex === index ? "#0f766e" : "#64748b"}
                        />
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
                </CardContent>
              ) : null}
            </Card>

            {allPhonetics.length ? (
              <Card>
                <CardContent style={styles.sourceToggleContent}>
                  <Pressable
                    accessibilityRole="button"
                    style={styles.sourceToggle}
                    onPress={() => setShowSourceData((isVisible) => !isVisible)}
                  >
                    <View style={styles.sourceToggleLabel}>
                      <Ionicons name="code-slash-outline" size={18} color="#475569" />
                      <Text style={styles.sourceToggleText}>API phonetics</Text>
                    </View>
                    <Ionicons name={showSourceData ? "chevron-up" : "chevron-down"} size={20} color="#475569" />
                  </Pressable>
                  {showSourceData ? <Text style={styles.apiPreview}>{phoneticsPreview}</Text> : null}
                </CardContent>
              </Card>
            ) : null}

            {allMeanings.length ? (
              allMeanings.map((meaning, meaningIndex) => (
                <Card key={`${meaning.partOfSpeech}-${meaningIndex}`}>
                  <CardHeader style={styles.meaningHeader}>
                    <Text style={styles.partOfSpeech}>{meaning.partOfSpeech}</Text>
                    <Text style={styles.definitionCountText}>
                      {meaning.definitions.length} {meaning.definitions.length === 1 ? "definition" : "definitions"}
                    </Text>
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
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 34
  },
  historyBadge: {
    alignItems: "center",
    backgroundColor: "#ccfbf1",
    borderRadius: 8,
    flexDirection: "row",
    gap: 5,
    minHeight: 36,
    paddingHorizontal: 10
  },
  historyBadgeText: {
    color: "#0f766e",
    fontSize: 14,
    fontWeight: "900"
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
  searchCard: {
    borderColor: "#cbd5e1"
  },
  searchForm: {
    gap: 14
  },
  searchActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  searchButtonWrap: {
    flex: 1
  },
  clearButton: {
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  recentSearches: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  recentChip: {
    backgroundColor: "#f8fafc",
    borderColor: "#dbe3ef",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8
  },
  recentChipText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "capitalize"
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
  wordCard: {
    borderColor: "#bfdbfe"
  },
  wordHeader: {
    alignItems: "flex-start",
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
  summaryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 8
  },
  summaryChip: {
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  summaryChipText: {
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: "900"
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
  pronunciationArea: {
    borderTopColor: "#e2e8f0",
    borderTopWidth: 1,
    gap: 10,
    paddingTop: 14
  },
  sectionLabel: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  audioChoices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-start"
  },
  audioChoice: {
    alignItems: "center",
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
    flexDirection: "row",
    gap: 6,
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
    marginTop: 10,
    padding: 12
  },
  sourceToggleContent: {
    paddingTop: 18
  },
  sourceToggle: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sourceToggleLabel: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  sourceToggleText: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "800"
  },
  meaningHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
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
  definitionCountText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "800"
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
