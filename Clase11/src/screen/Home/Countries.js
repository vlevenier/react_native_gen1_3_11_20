import React, {useCallback, useEffect, useState} from 'react';
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import colors from '../../config/colors';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAsyncStorage} from '@react-native-async-storage/async-storage';
import Axios from 'axios';
import * as Animatable from 'react-native-animatable'; // https://github.com/oblador/react-native-animatable
import {connect} from 'react-redux';
import {selectCountry} from '../../redux/actions';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    textAlign: 'center',
    fontSize: 30,
    marginVertical: 20,
    color: colors.gray,
  },
  textInput: {
    color: colors.gray,
  },
  countryContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  country: {
    marginVertical: 5,
    fontSize: 15,
    color: colors.gray,
  },
  inputContainer: {
    justifyContent: 'center',
    width: '70%',
    alignSelf: 'center',
    borderBottomColor: colors.gray,
    borderBottomWidth: 0.7,
    padding: 10,
  },
});

const Countries = ({navigation, selectCountry}) => {
  const [countries, updateCountries] = useState([]);
  const [searchCountry, updateSearchCountry] = useState([]);
  const {
    getItem: getCountryesItems,
    setItem: setCountriesItems,
  } = useAsyncStorage('countries');
  const {top} = useSafeAreaInsets();

  const getFromStorage = async () => JSON.stringify(await getCountryesItems);

  const filterCountries = useCallback(
    (searchText) => {
      if (searchText) {
        const result = countries.filter((country) =>
          country.Country.includes(searchText),
        );
        updateSearchCountry(result);
      } else {
        updateSearchCountry(countries);
      }
    },
    [countries],
  );

  const fetchCountries = useCallback(async () => {
    try {
      const {status, data} = await Axios.get(
        'https://api.covid19api.com/countries',
      );
      if (status === 200) {
        const orderedCountries = data.sort((a, b) => a.Country > b.Country);
        if (orderedCountries) {
          await setCountriesItems(JSON.stringify(orderedCountries));
        }
        updateCountries(orderedCountries || getFromStorage());
        updateSearchCountry(orderedCountries);
      }
    } catch (error) {
      updateCountries([]);
    }
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  return (
    <View style={[styles.container, {paddingTop: top}]}>
      <Text style={styles.title}>Selecciona un país</Text>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Buscar país..."
          placeholderTextColor={colors.gray}
          style={styles.textInput}
          onChangeText={filterCountries}
        />
      </View>
      <FlatList
        data={searchCountry}
        keyExtractor={(item) => item.Slug}
        renderItem={({item: {Slug, Country}}) => {
          const fadeIn = {
            0: {
              opacity: 0,
              scale: 0,
            },
            0.5: {
              opacity: 1,
              scale: 0.3,
            },
            1: {
              opacity: 1,
              scale: 1,
            },
          };

          return (
            <TouchableOpacity
              onPress={() => {
                selectCountry(Country);
                navigation.navigate('Home', {slug: Slug, country: Country});
              }}
              style={styles.countryContainer}>
              <Animatable.Text style={styles.country} animation={fadeIn}>
                {Country}
              </Animatable.Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const mapDispatchToProps = (dispatch) => ({
  selectCountry: (country) => dispatch(selectCountry(country)),
});

export default connect(null, mapDispatchToProps)(Countries);
