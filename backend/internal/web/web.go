package web

import "embed"

// Dist contains the React production bundle copied into this package before building the Go binary.
//
//go:embed dist/*
//go:embed dist/assets/*
var Dist embed.FS
