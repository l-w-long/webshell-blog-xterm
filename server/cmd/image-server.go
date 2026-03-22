package main

import (
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"math"
	"math/rand"
	"net/http"
)

func generateTestImage(w http.ResponseWriter, r *http.Request) {
	width := 400
	height := 300

	img := image.NewRGBA(image.Rect(0, 0, width, height))
	
	bgColor := color.RGBA{
		uint8(rand.Intn(100) + 50),
		uint8(rand.Intn(100) + 100),
		uint8(rand.Intn(100) + 50),
		255,
	}
	
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			img.Set(x, y, bgColor)
		}
	}
	
	for i := 0; i < 50; i++ {
		cx := rand.Intn(width)
		cy := rand.Intn(height)
		cr := rand.Intn(30) + 10
		
		circleColor := color.RGBA{
			uint8(rand.Intn(255)),
			uint8(rand.Intn(255)),
			uint8(rand.Intn(255)),
			200,
		}
		
		for dy := -cr; dy <= cr; dy++ {
			for dx := -cr; dx <= cr; dx++ {
				if dx*dx+dy*dy <= cr*cr {
					px, py := cx+dx, cy+dy
					if px >= 0 && px < width && py >= 0 && py < height {
						img.Set(px, py, circleColor)
					}
				}
			}
		}
	}
	
	var buf bytes.Buffer
	png.Encode(&buf, img)
	
	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Cache-Control", "public, max-age=3600")
	w.Write(buf.Bytes())
}

func handleImageRequest(w http.ResponseWriter, r *http.Request) {
	img := generateSampleImage(300, 200)
	
	w.Header().Set("Content-Type", "image/png")
	png.Encode(w, img)
}

func generateSampleImage(width, height int) image.Image {
	img := image.NewRGBA(image.Rect(0, 0, width, height))
	
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			t := float64(x) / float64(width)
			
			r := uint8(30 + 50*t + 20*math.Sin(float64(y)/20))
			g := uint8(100 + 80*math.Cos(float64(y)/30))
			b := uint8(150 + 50*math.Sin(float64(x+y)/40))
			
			img.Set(x, y, color.RGBA{R: r, G: g, B: b, A: 255})
		}
	}
	
	for i := 0; i < 20; i++ {
		x := rand.Intn(width)
		y := rand.Intn(height)
		size := rand.Intn(20) + 5
		
		c := color.RGBA{
			R: uint8(rand.Intn(255)),
			G: uint8(rand.Intn(255)),
			B: uint8(rand.Intn(255)),
			A: 180,
		}
		
		for dy := 0; dy < size; dy++ {
			for dx := 0; dx < size; dx++ {
				px, py := x+dx, y+dy
				if px < width && py < height {
					img.Set(px, py, c)
				}
			}
		}
	}
	
	return img
}

func main() {
	rand.Seed(42)
	
	http.HandleFunc("/api/test-image.png", generateTestImage)
	http.HandleFunc("/api/image", handleImageRequest)
	
	fmt.Println("Image server starting on :8081")
	http.ListenAndServe(":8081", nil)
}
