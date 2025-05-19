
```javascript
function MainComponent() {
  const [formData, setFormData] = React.useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    current_address: "",
    employment_status: "",
    monthly_income: "",
    desired_move_in_date: "",
    number_of_occupants: "",
    has_pets: false,
    pet_details: "",
    credit_score: "",
    additional_notes: "",
  });

  const [status, setStatus] = React.useState({ message: "", isError: false });
  const [selectedLanguage, setSelectedLanguage] = React.useState("en");
  const [translations, setTranslations] = React.useState({});
  const [addressSuggestions, setAddressSuggestions] = React.useState([]);
  const [locationError, setLocationError] = React.useState("");

  // List of supported languages
  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "zh", name: "Chinese" },
    { code: "ar", name: "العربية" },
  ];

  // Text content that needs translation
  const textContent = {
    title: "Rental Application",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    phone: "Phone",
    currentAddress: "Current Address",
    employmentStatus: "Employment Status",
    monthlyIncome: "Monthly Income",
    desiredMoveInDate: "Desired Move-in Date",
    numberOfOccupants: "Number of Occupants",
    creditScore: "Credit Score",
    hasPets: "Do you have pets?",
    petDetails: "Pet Details",
    petDetailsPlaceholder:
      "Please describe your pets (type, breed, size, etc.)",
    additionalNotes: "Additional Notes",
    additionalNotesPlaceholder:
      "Any additional information you'd like to share...",
    submit: "Submit Application",
    selectStatus: "Select status",
    fullTime: "Full-time",
    partTime: "Part-time",
    selfEmployed: "Self-employed",
    unemployed: "Unemployed",
    retired: "Retired",
    useCurrentLocation: "Use Current Location",
    locationError: "Could not get your location",
    searchAddress: "Search for address...",
  };

  // Function to translate text
  const translateText = async (text, target) => {
    try {
      const response = await fetch(
        "/integrations/google-translate/language/translate/v2",
        {
          method: "POST",
          body: new URLSearchParams({
            q: text,
            target,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Translation failed");
      }

      const data = await response.json();
      return data.data.translations[0].translatedText;
    } catch (error) {
      console.error("Translation error:", error);
      return text; // Fallback to original text
    }
  };

  // Effect to translate all text when language changes
  React.useEffect(() => {
    if (selectedLanguage === "en") {
      setTranslations(textContent);
      return;
    }

    const translateAll = async () => {
      const translatedContent = {};
      for (const [key, value] of Object.entries(textContent)) {
        translatedContent[key] = await translateText(value, selectedLanguage);
      }
      setTranslations(translatedContent);
    };

    translateAll();
  }, [selectedLanguage]);

  // Function to get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `/integrations/google-place-autocomplete/autocomplete/json?` +
              new URLSearchParams({
                input: `${position.coords.latitude},${position.coords.longitude}`,
                radius: "500",
              }),
          );

          if (!response.ok) {
            throw new Error("Failed to get address suggestions");
          }

          const data = await response.json();
          if (data.predictions && data.predictions.length > 0) {
            setFormData((prev) => ({
              ...prev,
              current_address: data.predictions[0].description,
            }));
            setAddressSuggestions([]);
          }
        } catch (error) {
          setLocationError("Could not get address for your location");
        }
      },
      () => {
        setLocationError("Could not get your location");
      },
    );
  };

  // Function to handle address search
  const handleAddressSearch = async (searchText) => {
    try {
      setFormData((prev) => ({ ...prev, current_address: searchText }));

      if (!searchText.trim()) {
        setAddressSuggestions([]);
        return;
      }

      const response = await fetch(
        `/integrations/google-place-autocomplete/autocomplete/json?` +
          new URLSearchParams({
            input: searchText,
            radius: "500",
          }),
      );

      if (!response.ok) {
        throw new Error("Failed to get address suggestions");
      }

      const data = await response.json();
      setAddressSuggestions(data.predictions || []);
    } catch (error) {
      console.error("Address search error:", error);
      setAddressSuggestions([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/submit-rental-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setStatus({
        message: "Application submitted successfully!",
        isError: false,
      });
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        current_address: "",
        employment_status: "",
        monthly_income: "",
        desired_move_in_date: "",
        number_of_occupants: "",
        has_pets: false,
        pet_details: "",
        credit_score: "",
        additional_notes: "",
      });
    } catch (error) {
      setStatus({
        message: error.message || "Failed to submit application",
        isError: true,
      });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
        <div className="flex justify-between items-center mb-8">
          <h1
            className={`text-3xl font-bold font-roboto ${selectedLanguage === "ar" ? "text-right" : "text-left"}`}
          >
            {translations.title || textContent.title}
          </h1>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            dir={selectedLanguage === "ar" ? "rtl" : "ltr"}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {status.message && (
          <div
            className={`mb-4 p-4 rounded ${
              status.isError
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {status.message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
          dir={selectedLanguage === "ar" ? "rtl" : "ltr"}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {translations.firstName || textContent.firstName}
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {translations.lastName || textContent.lastName}
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {translations.email || textContent.email}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {translations.phone || textContent.phone}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">
              {translations.currentAddress || textContent.currentAddress}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="current_address"
                value={formData.current_address}
                onChange={(e) => handleAddressSearch(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder={
                  translations.searchAddress || textContent.searchAddress
                }
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                className="mt-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <i className="fas fa-location-dot"></i>
              </button>
            </div>
            {locationError && (
              <p className="mt-2 text-sm text-red-600">
                {translations.locationError || locationError}
              </p>
            )}
            {addressSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-auto">
                {addressSuggestions.map((suggestion) => (
                  <li
                    key={suggestion.place_id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        current_address: suggestion.description,
                      }));
                      setAddressSuggestions([]);
                    }}
                  >
                    {suggestion.description}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {translations.employmentStatus || textContent.employmentStatus}
              </label>
              <select
                name="employment_status"
                value={formData.employment_status}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">
                  {translations.selectStatus || textContent.selectStatus}
                </option>
                <option value="Full-time">
                  {translations.fullTime || textContent.fullTime}
                </option>
                <option value="Part-time">
                  {translations.partTime || textContent.partTime}
                </option>
                <option value="Self-employed">
                  {translations.selfEmployed || textContent.selfEmployed}
                </option>
                <option value="Unemployed">
                  {translations.unemployed || textContent.unemployed}
                </option>
                <option value="Retired">
                  {translations.retired || textContent.retired}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {translations.monthlyIncome || textContent.monthlyIncome}
              </label>
              <input
                type="number"
                name="monthly_income"
                value={formData.monthly_income}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {translations.desiredMoveInDate ||
                  textContent.desiredMoveInDate}
              </label>
              <input
                type="date"
                name="desired_move_in_date"
                value={formData.desired_move_in_date}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {translations.numberOfOccupants ||
                  textContent.numberOfOccupants}
              </label>
              <input
                type="number"
                name="number_of_occupants"
                value={formData.number_of_occupants}
                onChange={handleChange}
                required
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {translations.creditScore || textContent.creditScore}
              </label>
              <input
                type="number"
                name="credit_score"
                value={formData.credit_score}
                onChange={handleChange}
                min="300"
                max="850"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="has_pets"
                checked={formData.has_pets}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                {translations.hasPets || textContent.hasPets}
              </label>
            </div>
          </div>

          {formData.has_pets && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {translations.petDetails || textContent.petDetails}
              </label>
              <textarea
                name="pet_details"
                value={formData.pet_details}
                onChange={handleChange}
                rows="3"
                placeholder={
                  translations.petDetailsPlaceholder ||
                  textContent.petDetailsPlaceholder
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {translations.additionalNotes || textContent.additionalNotes}
            </label>
            <textarea
              name="additional_notes"
              value={formData.additional_notes}
              onChange={handleChange}
              rows="4"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder={
                translations.additionalNotesPlaceholder ||
                textContent.additionalNotesPlaceholder
              }
            />
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {translations.submit || textContent.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```
