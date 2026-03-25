import React from 'react';
import { Link } from 'react-router-dom';
import { Camera } from 'lucide-react';

export default function NotFoundPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
            <div className="mb-8 text-stone-200">
                <Camera className="w-24 h-24 mx-auto" strokeWidth={1} />
            </div>
            <h1
                className="text-8xl font-bold text-stone-900 mb-4"
                style={{ fontFamily: 'var(--font-heading)' }}
            >
                404
            </h1>
            <p
                className="text-2xl font-semibold text-stone-700 mb-3"
                style={{ fontFamily: 'var(--font-heading)' }}
            >
                Halaman Tidak Ditemukan
            </p>
            <p className="text-stone-400 text-sm max-w-xs mb-10">
                Sepertinya halaman yang kamu cari sudah dipindahkan atau tidak pernah ada.
            </p>
            <Link
                to="/"
                className="px-8 py-3 bg-stone-900 text-white font-bold rounded-full hover:bg-black transition-all hover:scale-105 transform duration-300 text-sm"
                style={{ fontFamily: 'var(--font-heading)' }}
            >
                Kembali ke Beranda
            </Link>
        </div>
    );
}
