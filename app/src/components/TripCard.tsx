import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import globalStyles from "@/src/assets/styles";
import { useRouter } from "expo-router";

// props and style of trip card 
// displayed in trips page

type TripCardProps = {
  title: string;
  bikeID: string;
  tripStart: string;
  tripEnd: string;
  remarks: string;
  addtl_charge?: number;
  tripID: string;
  start_rack: string;
  end_rack: string;
  onUpdate?: () => void;
};

export default function TripCard({
  title,
  bikeID,
  tripStart,
  tripEnd,
  remarks,
  addtl_charge,
  tripID,
  start_rack,
  end_rack,
  onUpdate,
}: TripCardProps) {
  const statusStyles = getStatusStyles(remarks, addtl_charge); // remarks = status string
  const router = useRouter();  

  const handleCancel = async (tripID: string) => {
    try {
      const res = await fetch("http://localhost:3000/api/bikeActions/cancel", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tripID })
      });

      if (res.ok) {
        console.log("Trip deleted");
        onUpdate?.();
      } else {
        const { error } = await res.json();
        console.error("[APP] Failed to delete trip:", error);
      }
    } catch (err) {
      console.error("[APP] Error deleting trip:", err);
    }
  };


  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.subtitle}>{title}</Text>

      <View style={globalStyles.row}>
        {/*Left*/}
        <View style={globalStyles.column}>
          <Text style={tripStyles.label}>Trip Start: </Text>
          <Text style={tripStyles.detail}>{formatDate(tripStart)}</Text>
          <Text style={tripStyles.label}>Trip End: </Text>
          <Text style={tripStyles.detail}>{formatDate(tripEnd)}</Text>
        </View>

        {/*Right*/}
        <View style={globalStyles.column}>
          <Text style={tripStyles.label}> From: </Text>
          <Text style={tripStyles.detail}> {start_rack}</Text>
          <Text style={tripStyles.label}> To: </Text>
          <Text style={tripStyles.detail}> {end_rack}</Text>
        </View>
      </View>
      
      <View style={globalStyles.row}>
        {/*Left*/}
        <View style={[globalStyles.column, { alignItems: 'flex-start' }]}>
          { remarks != 'reserved' && (
            <View style={[globalStyles.statusBox, statusStyles.container]}>
              <Text style={[{ fontWeight: '600' }, {textTransform: 'capitalize'}, statusStyles.text]}>
                {addtl_charge && addtl_charge > 0 ? 'Overdue: Php ' + addtl_charge : remarks}
              </Text>
            </View>
          )}
        </View>

        {/*Right*/}
        <View style={[globalStyles.column, { alignItems: 'flex-end' }]}> 
          { addtl_charge && addtl_charge > 0 && ( // penalty information 
            <TouchableOpacity
              style={[globalStyles.statusBox, {backgroundColor: '#e2e3e5'}]}
              onPress={() => router.replace('/profile')} // go to profile
              activeOpacity={0.8}
              >
              <Text>Penalty information</Text>
            </TouchableOpacity>
          )}
          { remarks === 'active' && ( // nearest rack to me 
            <TouchableOpacity
              style={[globalStyles.statusBox, {backgroundColor: '#e2e3e5'}]}
              onPress={() => router.replace('/')} // go to maps?
              activeOpacity={0.8}
              >
              <Text> Nearest rack to me</Text>
            </TouchableOpacity>
          )}
          { remarks === 'reserved' && ( // cancel reservation 
            <TouchableOpacity
              style={[globalStyles.statusBox, {backgroundColor: '#e2e3e5'}]}
              onPress={() => handleCancel(tripID)} // handle cancel/delete, use tripID
              activeOpacity={0.8}
              >
              <Text>Cancel reservation</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      { remarks != 'reserved' && ( // nearest rack to me 
        <Text style={[tripStyles.detail, {color: '#721c24'}, {marginTop: 8}]}>
          <Text style={[tripStyles.label, {color: '#721c24'}]}>Remarks: </Text>
          [time left or overdue balance]
        </Text>
      )}
    </View>
  );
}

const tripStyles = StyleSheet.create({
  detail: {
    marginLeft: 5,
    fontSize: 14,
    color: '#555',
  },
  label: {
    fontWeight: 'bold',
    color: '#555',
  },
});

// diff colored status boxes
const getStatusStyles = (status: string, addtlCharge?: number) => {
 if (addtlCharge && addtlCharge > 0) {
    return { // red; overdue
      container: {
        backgroundColor: '#f8d7da',
        borderColor: '#721c24',
      },
      text: {
        color: '#721c24',
      },
    };
  }
  
  switch (status.toLowerCase()) {
    case 'active': // yellow
      return {
        container: {
          backgroundColor: '#fff3cd',
          borderColor: '#856404',
        },
        text: {
          color: '#856404',
        },
      };
    case 'completed': // green
      return {
        container: {
          backgroundColor: '#d4edda',
          borderColor: '#155724',
        },
        text: {
          color: '#155724',
        },
      };
    default: // gray
      return {
        container: {
          backgroundColor: '#e2e3e5',
          borderColor: '#6c757d',
        },
        text: {
          color: '#6c757d',
        },
      };
  }
};

// date time display format
const formatDate = (dateString: string): string => {

  if (dateString) {
    const date = new Date(dateString);

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',  
      day: 'numeric', 
    };

    const datePart = date.toLocaleDateString('en-US', options);
    const timePart = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    return `${datePart} (${timePart})`;
    }
    return '';
};