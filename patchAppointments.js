const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('..', 'Frontend', 'src', 'components', 'appointments.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add imports
content = content.replace(
  "import React, { useState, useMemo } from 'react';",
  "import React, { useState, useMemo, useEffect } from 'react';\nimport toast from 'react-hot-toast';\nimport { Loader } from 'lucide-react';"
);

// 2. Replace state initialization
const oldStateStart = `export default function appointments({ currentRole }) {
  const [appointments, setAppointments] = useState(
    currentRole === 'Doctor'
      ? APPOINTMENTS.filter((a) => a.doctorName === 'Dr. Sarah Connor')
      : APPOINTMENTS
  );`;

const newState = `export default function appointments({ currentRole }) {
  const [appointments, setAppointments] = useState([]);
  const [petOwners, setPetOwners] = useState([]);
  const [pets, setPets] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: \`Bearer \${token}\` };
      
      const [aptsRes, ownersRes, petsRes, usersRes] = await Promise.all([
        fetch('http://localhost:5000/api/v1/appointments', { headers }),
        fetch('http://localhost:5000/api/v1/owners', { headers }),
        fetch('http://localhost:5000/api/v1/pets', { headers }),
        fetch('http://localhost:5000/api/v1/users', { headers })
      ]);
      
      const aptsData = await aptsRes.json();
      const ownersData = await ownersRes.json();
      const petsData = await petsRes.json();
      const usersData = await usersRes.json();

      if (aptsData.status === 'success') {
        const formattedApts = aptsData.data.map(apt => {
          const dateStr = apt.appointment_date.split('T')[0];
          const [hour, minute] = apt.appointment_time.split(':');
          const hr = parseInt(hour, 10);
          const ampm = hr >= 12 ? 'PM' : 'AM';
          const hr12 = hr % 12 || 12;
          const timeStr = \`\${hr12.toString().padStart(2, '0')}:\${minute} \${ampm}\`;

          return {
            id: apt.id,
            ownerId: apt.ownerId,
            ownerName: apt.ownerName || 'Unknown',
            petId: apt.pet_id,
            petName: apt.petName || 'Unknown',
            breed: apt.petName || 'Unknown', // Using petName as fallback if breed is null
            doctorId: apt.doctor_id,
            doctorName: apt.doctorName || 'Unknown',
            date: dateStr,
            time: timeStr,
            reason: apt.notes,
            status: apt.status,
            isHomeVisit: apt.appointment_type === 'Home Visit'
          };
        });
        setAppointments(currentRole === 'Doctor' ? formattedApts : formattedApts);
      }
      
      if (ownersData.status === 'success') setPetOwners(ownersData.data);
      if (petsData.status === 'success') setPets(petsData.data);
      if (usersData.status === 'success') setDoctors(usersData.data.filter(u => u.role === 'Doctor'));

    } catch (err) {
      console.error(err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentRole]);`;

content = content.replace(oldStateStart, newState);

// 3. Replace handleBookAppointment
const oldHandleBookStart = `  const handleBookAppointment = (e) => {
    e.preventDefault();
    if (!ownerId || !petId || !doctorId || !date || !time) {
      alert('Please fill out all booking fields.');
      return;
    }
    const selectedOwner = PET_OWNERS.find((o) => o.id === ownerId);
    const selectedPet = PETS.find((p) => p.id === petId);
    const selectedDoc = USERS.find((u) => u.id === doctorId);
    const newApt = {
      id: \`apt-\${appointments.length + 301}\`,
      ownerId,
      ownerName: selectedOwner?.name || 'Unknown',
      petId,
      petName: selectedPet?.name || 'Unknown',
      breed: selectedPet?.breed || 'Unknown',
      doctorName: selectedDoc?.name || 'Unknown',
      date,
      time,
      reason,
      status: 'Upcoming',
      isHomeVisit,
    };
    setAppointments([newApt, ...appointments]);
    setSelectedDate(date);
    setViewMode('Day');
    alert(\`Appointment booked successfully!\\nAuto-reminder sent to \${selectedOwner?.email || 'client'}.\`);
    setOwnerId('');
    setPetId('');
    setDoctorId('');
    setDate('');
    setTime('');
    setReason('');
    setIsHomeVisit(false);
    setShowBookingModal(false);
  };`;

const newHandleBook = `  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!ownerId || !petId || !doctorId || !date || !time) {
      toast.error('Please fill out all booking fields.');
      return;
    }
    
    // convert time like "09:30 AM" to "HH:mm:00"
    let [t, ampm] = time.split(' ');
    let [h, m] = t.split(':');
    let hNum = parseInt(h, 10);
    if (ampm === 'PM' && hNum < 12) hNum += 12;
    if (ampm === 'AM' && hNum === 12) hNum = 0;
    const dbTime = \`\${hNum.toString().padStart(2, '0')}:\${m}:00\`;

    const payload = {
      petId, doctorId,
      appointmentDate: date,
      appointmentTime: dbTime,
      appointmentType: isHomeVisit ? 'Home Visit' : 'Clinic Visit',
      notes: reason
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/v1/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        toast.success('Appointment booked successfully!');
        fetchData();
        setSelectedDate(date);
        setViewMode('Day');
        setOwnerId(''); setPetId(''); setDoctorId(''); setDate(''); setTime(''); setReason(''); setIsHomeVisit(false);
        setShowBookingModal(false);
      } else {
        toast.error(data.message || 'Failed to book appointment');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error booking appointment');
    }
  };`;

content = content.replace(oldHandleBookStart, newHandleBook);

// 4. Replace handleUpdateStatus
const oldHandleUpdateStart = `  const handleUpdateStatus = (aptId, newStatus) => {
    setAppointments(appointments.map((a) => (a.id === aptId ? { ...a, status: newStatus } : a)));
    if (newStatus === 'Completed') {
      alert('Consultation marked completed.');
    }
  };`;

const newHandleUpdate = `  const handleUpdateStatus = async (aptId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (newStatus === 'Cancelled') {
        const res = await fetch(\`http://localhost:5000/api/v1/appointments/\${aptId}\`, {
          method: 'DELETE',
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        const data = await res.json();
        if (data.status === 'success') {
          toast.success('Appointment cancelled successfully');
          fetchData();
        }
      } else {
        const res = await fetch(\`http://localhost:5000/api/v1/appointments/\${aptId}\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
          body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (data.status === 'success') {
          toast.success(\`Consultation marked \${newStatus.toLowerCase()}.\`);
          fetchData();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating status');
    }
  };`;

content = content.replace(oldHandleUpdateStart, newHandleUpdate);

// 5. Replace references to PET_OWNERS, PETS, USERS in the JSX
content = content.replace(/PET_OWNERS\.map/g, 'petOwners.map');
content = content.replace(/PETS\.map/g, 'pets.map');
content = content.replace(/USERS\.filter\(\(u\) => u\.role === 'Doctor'\)\.map/g, 'doctors.map');

// 6. Optional: wrap main return with loader
const mainReturn = `    <div className="appointments-page">`;
content = content.replace(mainReturn, `    <div className="appointments-page">\n      {loading && <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm"><Loader className="animate-spin text-primary" size={32} /></div>}`);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('appointments.jsx updated successfully.');
