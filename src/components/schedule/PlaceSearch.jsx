import React, { useRef, useState } from 'react';
import { GoogleMap, Marker, useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { supabase } from '../../supabase';


export default function PlaceSearch({ tripId, onSuccess }) {
  // 구글 Maps API 키는 환경변수나 직접 하드코딩 가능(보안상 .env 권장)
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_PLACES_KEY, // TODO: 본인 키로 대체
    libraries: ['places'],
  });
  const [query, setQuery] = useState('');
  const [mapCenter, setMapCenter] = useState({lat: 37.5665, lng: 126.9780}); // 서울 초기화
  const [marker, setMarker] = useState(null);
  const autocompleteRef = useRef(null);

  // 장소 선택 → DB 저장
  async function handleSavePlace(name, lat, lng, address) {
    if (!tripId) return alert("여행 정보 먼저 만드세요!");
    
    const { data, error } = await supabase.from("places").insert([{
      trip_id: tripId,
      name, lat, lng, address
    }]).select().single();
    
    if (error) alert("저장 오류: " + error.message);
    else {
      // 선택한 장소 반환
      onSuccess && onSuccess({
        id: data.id,
        name: data.name,
        lat: data.lat,
        lng: data.lng,
        address: data.address
      });
      alert("장소 저장 성공!");
    }
  }

  if (!isLoaded) return <div>지도를 불러오는 중...</div>;

  return (
    <div>
      {/* 주소/장소 자동완성 검색 input */}
      <Autocomplete 
        onLoad={ac => autocompleteRef.current = ac}
        onPlaceChanged={() => {
          const place = autocompleteRef.current?.getPlace();
          if (!place || !place.geometry) return;
          const location = place.geometry.location;
          const lat = location?.lat() || 0;
          const lng = location?.lng() || 0;
          setMapCenter({ lat, lng });
          setMarker({ lat, lng });
          setQuery(place.formatted_address || place.name || '');

          handleSavePlace(
            place.name || place.formatted_address || '',
            lat,
            lng,
            place.formatted_address || ''
          );
        }}
      >
        <input
          type="text"
          className='input'
          placeholder="장소/주소 검색"
          style={{ width: 240, padding: 8, marginBottom: 8 }}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </Autocomplete>

      {/* 지도&마커 */}
      <GoogleMap
        center={marker || mapCenter}
        zoom={marker ? 15 : 10}
        mapContainerStyle={{ width: '100%', height: '320px', marginBottom: 12 }}
        onClick={e => {
          const lat = e.latLng?.lat();
          const lng = e.latLng?.lng();
          if (lat && lng) {
            setMarker({ lat, lng });
            setMapCenter({ lat, lng });
          }
        }}
      >
        {marker && <Marker position={marker} />}
      </GoogleMap>
    </div>
  );
}