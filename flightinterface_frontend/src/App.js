import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const FlightInterface = () => {
    const [altitude, setAltitude] = useState('');
    const [his, setHis] = useState('');
    const [adi, setAdi] = useState('');
    const [items, setItems] = useState([]);
    const [error, setError] = useState(null);
    const [mode, setMode] = useState('VISUAL');
    const [isInputVisible, setInputVisible] = useState(false);
    const [currentAltitude, setCurrentAltitude] = useState(null);
    const [currentHis, setCurrentHis] = useState(null);
    const [currentAdi, setCurrentAdi] = useState(null);

    const API_URL = 'http://localhost:4000';

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await axios.get(`${API_URL}/load-items`);
            setItems(response.data);
            if (response.data.length > 0) {
                const lastItem = response.data[response.data.length - 1];
                setCurrentAltitude(lastItem.altitude);
                setCurrentHis(lastItem.HIS);
                setCurrentAdi(lastItem.ADI);
            }
        } catch (err) {
            setError('Failed to load items');
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            altitude: Number(altitude),
            HIS: Number(his),
            ADI: Number(adi),
        };
        try {
            const response = await axios.post(`${API_URL}/add-item`, payload);
            console.log('Submitted successfully:', response.data);
            setAltitude('');
            setHis('');
            setAdi('');
            setCurrentAltitude(payload.altitude);
            setCurrentHis(payload.HIS);
            setCurrentAdi(payload.ADI);
            await fetchItems();
            setInputVisible(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit data');
            console.error(err);
        }
    };

    const altitudePosition = () => {
        const alt = Number(currentAltitude);
        if (isNaN(alt) || alt < 0 || alt > 3000) return 0;
        return (alt / 3000) * 100;
    };

    const hisRotation = () => {
        const heading = Number(currentHis);
        if (isNaN(heading) || heading < 0 || heading > 360) return 0;
        return heading;
    };

    const adiPitchPosition = () => {
        const pitch = Number(currentAdi);
        if (isNaN(pitch)) return 50;
        const clampedPitch = Math.max(-100, Math.min(100, pitch));
        return 50 + (clampedPitch / 100) * 50;
    };
    const TextModeComponent = () => (
        <div className="text-mode">
            <div className="oval">
                Altitude: {currentAltitude !== null ? currentAltitude : 'N/A'}
            </div>
            <div className="oval">
                HIS: {currentHis !== null ? currentHis : 'N/A'}
            </div>
            <div className="oval">
                ADI: {currentAdi !== null ? currentAdi : 'N/A'}
            </div>
        </div>
    );

    const VisualModeComponent = () => (
        <div className="visual-mode">
            <div className="altitude-scale">
                <div className="scale">
                    <span>3000</span>
                    <span>2000</span>
                    <span>1000</span>
                    <span>0</span>
                    <div
                        className="altitude-marker"
                        style={{
                            bottom: `${altitudePosition()}%`,
                        }}
                    />
                </div>
            </div>

            <div className="heading-indicator">
                <div className="circle">
                    <div
                        className="arrow"
                        style={{
                            transform: `rotate(${hisRotation()}deg)`,
                        }}
                    >
                        ↑
                    </div>
                    <span className="angle top">0</span>
                    <span className="angle right">90</span>
                    <span className="angle bottom">180</span>
                    <span className="angle left">270</span>
                </div>
            </div>

            <div className="attitude-indicator">
                <div className="attitude-circle">
                    <div
                        className="horizon"
                        style={{
                            top: `${adiPitchPosition()}%`,
                        }}
                    >
                        <div className="sky"></div>
                        <div className="ground"></div>
                    </div>
                    <div className="aircraft-marker"></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flight-interface">
            <div className="top-buttons">
                <button
                    className={`top-btn ${mode === 'TEXT' ? 'active' : ''}`}
                    onClick={() => setMode('TEXT')}
                >
                    TEXT
                </button>
                <button
                    className={`top-btn ${mode === 'VISUAL' ? 'active' : ''}`}
                    onClick={() => setMode('VISUAL')}
                >
                    VISUAL
                </button>
                <button
                    className="top-btn plus-btn"
                    onClick={() => setInputVisible(!isInputVisible)}
                >
                    +
                </button>
            </div>

            <div className="main-content">
                {mode === 'TEXT' ? <TextModeComponent /> : <VisualModeComponent />}
            </div>

            {isInputVisible && (
                <div className="input-section-wrapper">
                    <div className="input-section">
                        <div className="input-group">
                            <label>ALT</label>
                            <input
                                type="text"
                                value={altitude}
                                onChange={(e) => setAltitude(e.target.value)}
                                placeholder={"enter(between 0 to 3000}"}
                            />
                        </div>
                        <div className="input-group">
                            <label>HIS</label>
                            <input
                                type="text"
                                value={his}
                                onChange={(e) => setHis(e.target.value)}
                                placeholder={"enter(between 0 to 360"}
                            />
                        </div>
                        <div className="input-group">
                            <label>ADI</label>
                            <input
                                type="text"
                                value={adi}
                                onChange={(e) => setAdi(e.target.value)}
                                placeholder={"enter(between -100 to 100)"}
                            />
                        </div>
                        <button className="send-btn" onClick={handleSubmit}>
                            SEND →
                        </button>
                    </div>
                </div>
            )}

            {error && <div className="error">{error}</div>}

            <div className="items-list">
                <h3>Stored Items</h3>
                {items.length > 0 ? (
                    <ul>
                        {items.map((item, index) => (
                            <li key={index}>
                                Altitude: {item.altitude}, HIS: {item.HIS}, ADI: {item.ADI}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No items found</p>
                )}
            </div>
        </div>
    );
};

export default FlightInterface;