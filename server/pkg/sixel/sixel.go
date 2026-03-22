package sixel

import (
	"bytes"
	"image"
	"image/draw"
	"image/png"
	"math"
)

type Encoder struct {
	width   int
	height  int
	palette [][3]uint8
}

func NewEncoder(width, height int) *Encoder {
	return &Encoder{
		width:  width,
		height: height,
		palette: createWebSafePalette(),
	}
}

func createWebSafePalette() [][3]uint8 {
	palette := make([][3]uint8, 256)
	
	levels := []uint8{0, 36, 73, 109, 145, 182, 218, 255}
	
	i := 0
	for r := range levels {
		for g := range levels {
			for b := range levels {
				if i < 256 {
					palette[i] = [3]uint8{levels[r], levels[g], levels[b]}
					i++
				}
			}
		}
	}
	
	for i < 256 {
		palette[i] = [3]uint8{0, 0, 0}
		i++
	}
	
	return palette
}

func (e *Encoder) findClosestColor(r, g, b uint8) int {
	minDist := math.MaxFloat64
	bestIndex := 0
	
	for i, color := range e.palette {
		dr := float64(int(r) - int(color[0]))
		dg := float64(int(g) - int(color[1]))
		db := float64(int(b) - int(color[2]))
		
		dist := dr*dr + dg*dg + db*db
		
		if dist < minDist {
			minDist = dist
			bestIndex = i
		}
	}
	
	return bestIndex
}

func (e *Encoder) Quantize(img image.Image) [][]int {
	bounds := img.Bounds()
	result := make([][]int, bounds.Dy())
	
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		result[y-bounds.Min.Y] = make([]int, bounds.Dx())
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			r, g, b, a := img.At(x, y).RGBA()
			
			if a < 32768 {
				result[y-bounds.Min.Y][x-bounds.Min.X] = -1
				continue
			}
			
			ri := uint8(r >> 8)
			gi := uint8(g >> 8)
			bi := uint8(b >> 8)
			
			result[y-bounds.Min.Y][x-bounds.Min.X] = e.findClosestColor(ri, gi, bi)
		}
	}
	
	return result
}

func (e *Encoder) EncodeSixel(img image.Image) ([]byte, error) {
	var buf bytes.Buffer
	
	bounds := img.Bounds()
	pixelWidth := bounds.Dx()
	pixelHeight := bounds.Dy()
	
	buf.WriteString("\x1bP0;0;8;q")
	
	buf.WriteString("1;1;")
	buf.WriteString(formatNumber(pixelWidth))
	buf.WriteString(";")
	buf.WriteString(formatNumber(pixelHeight))
	buf.WriteString("#0")
	
	quantized := e.Quantize(img)
	
	sliceHeight := 6
	for startY := 0; startY < pixelHeight; startY += sliceHeight {
		endY := startY + sliceHeight
		if endY > pixelHeight {
			endY = pixelHeight
		}
		
		sliceH := endY - startY
		colors := make(map[int][][]int)
		
		for y := startY; y < endY; y++ {
			for x := 0; x < pixelWidth; x++ {
				color := quantized[y][x]
				if color == -1 {
					continue
				}
				colors[color] = append(colors[color], []int{y - startY, x})
			}
		}
		
		for colorIndex, pixels := range colors {
			if len(pixels) == 0 {
				continue
			}
			
			sixelBits := make([]bool, sliceHeight*pixelWidth)
			for _, pixel := range pixels {
				row, col := pixel[0], pixel[1]
				for bit := 0; bit < 6; bit++ {
					if row*6+bit < sliceHeight*pixelWidth {
						sixelBits[row*pixelWidth+col*6+bit] = true
					}
				}
			}
			
			rleCount := 1
			prevBit := sixelBits[0]
			for i := 1; i < len(sixelBits); i++ {
				if sixelBits[i] == prevBit {
					rleCount++
				} else {
					if prevBit {
						buf.WriteString(formatRLE(rleCount))
						buf.WriteString("!")
						buf.WriteString(formatNumber(colorIndex))
					}
					prevBit = sixelBits[i]
					rleCount = 1
				}
			}
			if prevBit {
				buf.WriteString(formatRLE(rleCount))
				buf.WriteString("!")
				buf.WriteString(formatNumber(colorIndex))
			}
			buf.WriteString("$")
		}
		
		buf.WriteString("-")
	}
	
	buf.WriteString("\x1b\\")
	
	return buf.Bytes(), nil
}

func formatNumber(n int) string {
	if n == 0 {
		return "0"
	}
	
	var digits []byte
	for n > 0 {
		digits = append([]byte{byte('0' + n%10)}, digits...)
		n /= 10
	}
	return string(digits)
}

func formatRLE(n int) string {
	if n <= 1 {
		return ""
	}
	return formatNumber(n - 1)
}

func ResizeImage(img image.Image, maxWidth, maxHeight int) image.Image {
	bounds := img.Bounds()
	origWidth := bounds.Dx()
	origHeight := bounds.Dy()
	
	ratio := math.Min(
		float64(maxWidth)/float64(origWidth),
		float64(maxHeight)/float64(origHeight),
	)
	
	if ratio >= 1.0 {
		return img
	}
	
	newWidth := int(float64(origWidth) * ratio)
	newHeight := int(float64(origHeight) * ratio)
	
	newImg := image.NewRGBA(image.Rect(0, 0, newWidth, newHeight))
	draw.CatmullRom.Scale(newImg, newImg.Bounds(), img, bounds, draw.Over, nil)
	
	return newImg
}

func DecodePNG(data []byte) (image.Image, error) {
	return png.Decode(bytes.NewReader(data))
}

func EncodePNG(img image.Image) ([]byte, error) {
	var buf bytes.Buffer
	err := png.Encode(&buf, img)
	return buf.Bytes(), err
}
