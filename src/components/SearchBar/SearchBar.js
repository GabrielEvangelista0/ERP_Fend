"use client";

export default function SearchBar({ value, onChange, placeholder = "digite para buscar" }) {
    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 mb-6"
        />
    )
}
