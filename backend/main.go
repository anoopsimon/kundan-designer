package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

// ── request / response types ─────────────────────────────────────────────────

type GenerateRequest struct {
	PieceType   string   `json:"pieceType"`
	Metal       string   `json:"metal"`
	Stones      []string `json:"stones"`
	Style       string   `json:"style"`
	Arrangement string   `json:"arrangement"`
	ExtraPrompt string   `json:"extraPrompt"`
}

type GenerateResponse struct {
	ImageB64 string `json:"imageB64"`
	Prompt   string `json:"prompt"`
}

type HistoryEntry struct {
	ID        string          `json:"id"`
	Timestamp string          `json:"timestamp"`
	Request   GenerateRequest `json:"request"`
	ImageB64  string          `json:"imageB64"`
	Prompt    string          `json:"prompt"`
}

// in-memory history (replace with SQLite for persistence across restarts)
var history []HistoryEntry

// ── prompt builder ────────────────────────────────────────────────────────────

func buildPrompt(r GenerateRequest) string {
	pieceMap := map[string]string{
		"tikka":    "maang tikka (Indian head jewellery)",
		"jhumka":   "jhumka (Indian bell earrings)",
		"nath":     "nath (Indian nose ring)",
		"necklace": "Kundan necklace set",
		"payal":    "payal (Indian anklet)",
		"bangles":  "set of Indian bangles",
		"haar":     "long haar necklace",
		"choker":   "Kundan choker necklace",
	}
	metalMap := map[string]string{
		"gold":     "22k yellow gold",
		"silver":   "oxidised silver",
		"rosegold": "rose gold",
		"antique":  "antique gold with patina finish",
		"platinum": "white gold / platinum",
	}
	styleMap := map[string]string{
		"kundan":    "Kundan style with flat polished gemstones set in gold foil",
		"meenakari": "Meenakari style with vibrant enamel work in red green blue",
		"polki":     "Polki style with uncut raw diamonds",
		"plain":     "plain metalwork with no stones",
		"temple":    "South Indian temple jewellery style",
		"oxidised":  "oxidised silver tribal style",
	}
	arrangementMap := map[string]string{
		"single":    "single centrepiece stone",
		"cluster":   "cluster of stones",
		"border":    "stone-set border with plain centre",
		"fullset":   "fully stone-encrusted surface",
		"scattered": "scattered asymmetric stone placement",
	}

	piece := pieceMap[r.PieceType]
	if piece == "" {
		piece = r.PieceType
	}
	metal := metalMap[r.Metal]
	if metal == "" {
		metal = r.Metal
	}
	style := styleMap[r.Style]
	if style == "" {
		style = r.Style
	}
	arrangement := arrangementMap[r.Arrangement]
	if arrangement == "" {
		arrangement = "classic arrangement"
	}

	stonesStr := strings.Join(r.Stones, ", ")
	if stonesStr == "" {
		stonesStr = "no gemstones"
	}

	prompt := fmt.Sprintf(
		"Professional product photography of a %s, %s metal base, %s, "+
			"featuring %s arranged in %s pattern, "+
			"isolated on pure white background, studio lighting with soft shadows, "+
			"ultra detailed macro jewellery photography, 8k resolution, "+
			"sharp focus, photorealistic, commercial product shot",
		piece, metal, style, stonesStr, arrangement,
	)

	if r.ExtraPrompt != "" {
		prompt += ", " + r.ExtraPrompt
	}

	return prompt
}

// ── OpenAI gpt-image-1 call ───────────────────────────────────────────────────

type openAIImageRequest struct {
	Model   string `json:"model"`
	Prompt  string `json:"prompt"`
	N       int    `json:"n"`
	Size    string `json:"size"`
	Quality string `json:"quality"`
}

type openAIImageResponse struct {
	Data []struct {
		B64JSON string `json:"b64_json"`
		URL     string `json:"url"`
	} `json:"data"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

func generateImage(prompt string) (string, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("OPENAI_API_KEY not set")
	}

	payload := openAIImageRequest{
		Model:   "gpt-image-1",
		Prompt:  prompt,
		N:       1,
		Size:    "1024x1024",
		Quality: "high",
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", "https://api.openai.com/v1/images/generations", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var imgResp openAIImageResponse
	if err := json.Unmarshal(respBody, &imgResp); err != nil {
		return "", fmt.Errorf("parse error: %w — raw: %s", err, string(respBody))
	}
	if imgResp.Error != nil {
		return "", fmt.Errorf("openai error: %s", imgResp.Error.Message)
	}
	if len(imgResp.Data) == 0 {
		return "", fmt.Errorf("no image returned")
	}

	return imgResp.Data[0].B64JSON, nil
}

// ── HTTP handlers ─────────────────────────────────────────────────────────────

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func handleGenerate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req GenerateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request: "+err.Error(), http.StatusBadRequest)
		return
	}

	prompt := buildPrompt(req)
	log.Printf("Generating: %s", prompt)

	b64, err := generateImage(prompt)
	if err != nil {
		log.Printf("Error: %v", err)
		http.Error(w, "generation failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	entry := HistoryEntry{
		ID:        fmt.Sprintf("%d", time.Now().UnixMilli()),
		Timestamp: time.Now().Format(time.RFC3339),
		Request:   req,
		ImageB64:  b64,
		Prompt:    prompt,
	}
	history = append([]HistoryEntry{entry}, history...)
	if len(history) > 50 {
		history = history[:50]
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(GenerateResponse{ImageB64: b64, Prompt: prompt})
}

func handleHistory(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(history)
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// serve frontend static files in production
func handleFrontend(frontendDir string) http.Handler {
	fs := http.FileServer(http.Dir(frontendDir))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := frontendDir + r.URL.Path
		if _, err := os.Stat(path); os.IsNotExist(err) {
			// SPA fallback
			http.ServeFile(w, r, frontendDir+"/index.html")
			return
		}
		fs.ServeHTTP(w, r)
	})
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/generate", handleGenerate)
	mux.HandleFunc("/api/history", handleHistory)
	mux.HandleFunc("/api/health", handleHealth)

	// serve built frontend if dist/ exists
	if _, err := os.Stat("../frontend/dist"); err == nil {
		mux.Handle("/", handleFrontend("../frontend/dist"))
		log.Println("Serving frontend from ../frontend/dist")
	}

	handler := corsMiddleware(mux)
	log.Printf("Kundan Designer backend running on http://localhost:%s", port)

	// base64 decode helper exposed to confirm API key is set
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		log.Println("WARNING: OPENAI_API_KEY is not set — image generation will fail")
	} else {
		masked := apiKey[:8] + strings.Repeat("*", len(apiKey)-8)
		log.Printf("OpenAI API key loaded: %s", masked)
	}

	_ = base64.StdEncoding // imported for decode use in future
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatal(err)
	}
}
