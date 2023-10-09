#include <stdint.h>
#include <string.h>

uint32_t combine_rgba(uint8_t r, uint8_t g, uint8_t b, uint8_t a) {
  return (r << 24) | (g << 16) | (b << 8) | a;
}

void fill_canvas(int width, int height, uint32_t canvasData[], uint8_t r,
                 uint8_t g, uint8_t b, uint8_t a) {
  memset(canvasData, combine_rgba(r, g, b, a), width * height);
}

uint8_t test(uint8_t a, uint8_t b) { return a + b; }
