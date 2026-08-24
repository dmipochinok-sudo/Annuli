// Модель данных Annuli. Полностью совместима с legacy/Annuli_v2.10.html:
// те же имена полей, чтобы существующие базы IndexedDB читались без миграции.

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export interface Page {
  id?: string;
  imageId: string;
  /** Исходное имя файла скана (используется при экспорте в ZIP). */
  imageName?: string;
  thumb?: string;
  name?: string;
  transcription?: string;
  comment?: string;
  /** Служебное поле экспорта/импорта: путь файла внутри ZIP. */
  _file?: string;
}

export function mkPage(): Page {
  return { id: uid(), imageId: "", imageName: "", transcription: "", comment: "" };
}


export interface Military {
  unit: string;
  rank: string;
  position: string;
  serviceFrom: string;
  serviceTo: string;
  conflict: string;
  wounds: string;
  awards: string;
  death: string;
  pages: Page[];
  docId: string;
  archive: string;
  fund: string;
  opis: string;
  delo: string;
  list: string;
}

export interface Marriage {
  id: string;
  marriageDate: string;
  marriagePlace: string;
  marriageEnded: boolean;
  marriageEndDate: string;
  marriageEndReason: string;
  spouseLastName: string;
  spouseFirstName: string;
  spousePatronymic: string;
  spouseLinkedId: string;
  marriageDocName: string;
  marriageDocId: string;
  marriageDocPath: string;
  marriageDocPages: Page[];
  marriageDocArchive: string;
  marriageDocFund: string;
  marriageDocOpis: string;
  marriageDocDelo: string;
  marriageDocList: string;
  spouseIndex?: string;
  spouseAvatarImageId?: string;
}

export interface Child {
  id: string;
  linkedId: string;
  firstName: string;
  lastName: string;
  patronymic: string;
  personIndex?: string;
  avatarImageId?: string;
  gender: string;
  estate: string;
  birthDateApprox: boolean;
  birthDate: string;
  birthYearFrom: string;
  birthYearTo: string;
  birthPlace: string;
  birthDocName: string;
  birthDocId: string;
  birthDocPages: Page[];
  birthDocArchive: string;
  birthDocFund: string;
  birthDocOpis: string;
  birthDocDelo: string;
  birthDocList: string;
}

export interface Doc {
  id: string;
  docId: string;
  name: string;
  /** Дата документа. */
  date?: string;
  transcription: string;
  comment: string;
  /** Онлайн-ссылка на документ (совместимо со старым `path`). */
  path: string;
  archive: string;
  fund: string;
  opis: string;
  delo: string;
  list: string;
  pages: Page[];
  createdAt: string;
}

export interface Memory {
  id: string;
  lastName: string;
  firstName: string;
  patronymic: string;
  date: string;
  text: string;
  /** Связь автора воспоминаний с персоной базы. */
  linkedId?: string;
  personIndex?: string;
  /** Кто записал воспоминание. */
  recordedBy?: string;
  /** Обстоятельства записи. */
  circumstances?: string;
  comment?: string;
  avatarImageId?: string;
  avatarThumb?: string;
}

/** Место учёбы. */
export interface Education {
  id: string;
  school: string;
  speciality: string;
  dateFrom: string;
  dateTo: string;
  place: string;
  fund: string;
  opis: string;
  delo: string;
  list: string;
}

/** Место работы. */
export interface Job {
  id: string;
  employer: string;
  division: string;
  position: string;
  dateFrom: string;
  dateTo: string;
  endReason: string;
  place: string;
}

/** Место военной службы. */
export interface MilitaryPlace {
  id: string;
  unit: string;
  rank: string;
  position: string;
  dateFrom: string;
  dateTo: string;
  endReason: string;
  place: string;
}

export interface MilitaryConflict {
  id: string;
  name: string;
  dateFrom: string;
  dateTo: string;
}

export interface Award {
  id: string;
  name: string;
  date: string;
  rank: string;
  docNumber: string;
  storage: string;
}

/** Фотография в альбоме. */
export interface Photo {
  id: string;
  imageId: string;
  imageName?: string;
  thumb?: string;
  date: string;
  title: string;
  photoId: string;
  backText: string;
  place: string;
  comment: string;
  /** Служебное поле экспорта/импорта: путь файла внутри ZIP. */
  _file?: string;
}

export interface Album {
  id: string;
  albumId: string;
  name: string;
  storage: string;
  photos: Photo[];
}

export interface Sibling {
  id: string;
  linkedId?: string;
  firstName?: string;
  lastName?: string;
  patronymic?: string;
  [key: string]: unknown;
}

export interface Residence {
  id: string;
  [key: string]: unknown;
}

export interface Person {
  id: string;
  personIndex: string;
  generation: string;
  lastName: string;
  firstName: string;
  patronymic: string;
  gender: string;
  estate: string;
  isLateral: boolean;
  birthDateApprox: boolean;
  birthDate: string;
  birthYearFrom: string;
  birthYearTo: string;
  birthPlace: string;
  birthDocName: string;
  birthDocId: string;
  birthDocPath: string;
  birthDocPages: Page[];
  birthDocArchive: string;
  birthDocFund: string;
  birthDocOpis: string;
  birthDocDelo: string;
  birthDocList: string;
  fatherLastName: string;
  fatherFirstName: string;
  fatherPatronymic: string;
  fatherEstate: string;
  fatherLinkedId: string;
  fatherIndex?: string;
  fatherAvatarImageId?: string;
  motherLastName: string;
  motherFirstName: string;
  motherPatronymic: string;
  motherEstate: string;
  motherLinkedId: string;
  motherIndex?: string;
  motherAvatarImageId?: string;
  godfatherLastName: string;
  godfatherFirstName: string;
  godfatherPatronymic: string;
  godfatherPlace: string;
  godfatherIndex?: string;
  godfatherAvatarImageId?: string;
  godmotherLastName: string;
  godmotherFirstName: string;
  godmotherPatronymic: string;
  godmotherPlace: string;
  godmotherIndex?: string;
  godmotherAvatarImageId?: string;
  avatarThumb: string;
  avatarImageId: string;
  avatarImageName: string;
  siblings: Sibling[];
  residences: Residence[];
  children: Child[];
  marriages: Marriage[];
  documents: Doc[];
  memories: Memory[];
  military: Military;
  /** Учёба. */
  educations: Education[];
  educationDocs: Doc[];
  /** Карьера. */
  jobs: Job[];
  jobDocs: Doc[];
  /** Военная служба (новая структура). */
  militaryPlaces: MilitaryPlace[];
  militaryConflicts: MilitaryConflict[];
  militaryAwards: Award[];
  militaryDocs: Doc[];
  /** Фотоальбомы. */
  albums: Album[];
  deathDateApprox: boolean;
  deathDate: string;
  deathYearFrom: string;
  deathYearTo: string;
  deathPlace: string;
  burialPlace: string;
  deathCause: string;
  deathDocName: string;
  deathDocId: string;
  deathDocPath: string;
  deathDocPages: Page[];
  deathDocArchive: string;
  deathDocFund: string;
  deathDocOpis: string;
  deathDocDelo: string;
  deathDocList: string;
  createdAt: string;
  updatedAt: string;
}

export function mkMilitary(): Military {
  return {
    unit: "",
    rank: "",
    position: "",
    serviceFrom: "",
    serviceTo: "",
    conflict: "",
    wounds: "",
    awards: "",
    death: "",
    pages: [],
    docId: "",
    archive: "",
    fund: "",
    opis: "",
    delo: "",
    list: "",
  };
}

export function mkMarriage(): Marriage {
  return {
    id: uid(),
    marriageDate: "",
    marriagePlace: "",
    marriageEnded: false,
    marriageEndDate: "",
    marriageEndReason: "",
    spouseLastName: "",
    spouseFirstName: "",
    spousePatronymic: "",
    spouseLinkedId: "",
    marriageDocName: "",
    marriageDocId: "",
    marriageDocPath: "",
    marriageDocPages: [],
    marriageDocArchive: "",
    marriageDocFund: "",
    marriageDocOpis: "",
    marriageDocDelo: "",
    marriageDocList: "",
  };
}

export function mkChild(): Child {
  return {
    id: uid(),
    linkedId: "",
    firstName: "",
    lastName: "",
    patronymic: "",
    gender: "",
    estate: "",
    birthDateApprox: false,
    birthDate: "",
    birthYearFrom: "",
    birthYearTo: "",
    birthPlace: "",
    birthDocName: "",
    birthDocId: "",
    birthDocPages: [],
    birthDocArchive: "",
    birthDocFund: "",
    birthDocOpis: "",
    birthDocDelo: "",
    birthDocList: "",
  };
}

export function mkDoc(): Doc {
  return {
    id: uid(),
    docId: "",
    name: "",
    transcription: "",
    comment: "",
    path: "",
    archive: "",
    fund: "",
    opis: "",
    delo: "",
    list: "",
    pages: [],
    createdAt: new Date().toISOString(),
  };
}

export function mkMem(): Memory {
  return { id: uid(), lastName: "", firstName: "", patronymic: "", date: "", text: "" };
}

export function mkPerson(): Person {
  const now = new Date().toISOString();
  return {
    id: uid(),
    personIndex: "",
    generation: "",
    lastName: "",
    firstName: "",
    patronymic: "",
    gender: "",
    estate: "",
    isLateral: false,
    birthDateApprox: false,
    birthDate: "",
    birthYearFrom: "",
    birthYearTo: "",
    birthPlace: "",
    birthDocName: "",
    birthDocId: "",
    birthDocPath: "",
    birthDocPages: [],
    birthDocArchive: "",
    birthDocFund: "",
    birthDocOpis: "",
    birthDocDelo: "",
    birthDocList: "",
    fatherLastName: "",
    fatherFirstName: "",
    fatherPatronymic: "",
    fatherEstate: "",
    fatherLinkedId: "",
    motherLastName: "",
    motherFirstName: "",
    motherPatronymic: "",
    motherEstate: "",
    motherLinkedId: "",
    godfatherLastName: "",
    godfatherFirstName: "",
    godfatherPatronymic: "",
    godfatherPlace: "",
    godmotherLastName: "",
    godmotherFirstName: "",
    godmotherPatronymic: "",
    godmotherPlace: "",
    avatarThumb: "",
    avatarImageId: "",
    avatarImageName: "",
    siblings: [],
    residences: [],
    children: [],
    marriages: [],
    documents: [],
    memories: [],
    military: mkMilitary(),
    educations: [],
    educationDocs: [],
    jobs: [],
    jobDocs: [],
    militaryPlaces: [],
    militaryConflicts: [],
    militaryAwards: [],
    militaryDocs: [],
    albums: [],
    deathDateApprox: false,
    deathDate: "",
    deathYearFrom: "",
    deathYearTo: "",
    deathPlace: "",
    burialPlace: "",
    deathCause: "",
    deathDocName: "",
    deathDocId: "",
    deathDocPath: "",
    deathDocPages: [],
    deathDocArchive: "",
    deathDocFund: "",
    deathDocOpis: "",
    deathDocDelo: "",
    deathDocList: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function mkEducation(): Education {
  return {
    id: uid(),
    school: "",
    speciality: "",
    dateFrom: "",
    dateTo: "",
    place: "",
    fund: "",
    opis: "",
    delo: "",
    list: "",
  };
}

export function mkJob(): Job {
  return {
    id: uid(),
    employer: "",
    division: "",
    position: "",
    dateFrom: "",
    dateTo: "",
    endReason: "",
    place: "",
  };
}

export function mkMilitaryPlace(): MilitaryPlace {
  return {
    id: uid(),
    unit: "",
    rank: "",
    position: "",
    dateFrom: "",
    dateTo: "",
    endReason: "",
    place: "",
  };
}

export function mkConflict(): MilitaryConflict {
  return { id: uid(), name: "", dateFrom: "", dateTo: "" };
}

export function mkAward(): Award {
  return { id: uid(), name: "", date: "", rank: "", docNumber: "", storage: "" };
}

export function mkPhoto(): Photo {
  return {
    id: uid(),
    imageId: "",
    imageName: "",
    date: "",
    title: "",
    photoId: "",
    backText: "",
    place: "",
    comment: "",
  };
}

export function mkAlbum(): Album {
  return { id: uid(), albumId: "", name: "", storage: "", photos: [] };
}

/**
 * Переносит одиночную запись `military` старой схемы в новые массивы
 * (место службы, конфликт, документ). Исходное поле сохраняется как есть.
 */
function migrateMilitary(p: Person): Person {
  const m = p.military;
  if (!m) return p;
  const hasNew =
    p.militaryPlaces.length ||
    p.militaryConflicts.length ||
    p.militaryAwards.length ||
    p.militaryDocs.length;
  if (hasNew) return p;
  const out = { ...p };
  if (m.unit || m.rank || m.position || m.serviceFrom || m.serviceTo || m.death) {
    out.militaryPlaces = [
      {
        ...mkMilitaryPlace(),
        unit: m.unit || "",
        rank: m.rank || "",
        position: m.position || "",
        dateFrom: m.serviceFrom || "",
        dateTo: m.serviceTo || "",
        endReason: m.death || "",
      },
    ];
  }
  if (m.conflict) {
    out.militaryConflicts = [{ ...mkConflict(), name: m.conflict }];
  }
  if (m.awards) {
    out.militaryAwards = [{ ...mkAward(), name: m.awards }];
  }
  if ((m.pages || []).length || m.archive || m.fund || m.opis || m.delo || m.list) {
    out.militaryDocs = [
      {
        ...mkDoc(),
        docId: m.docId || "",
        name: "Документ о военной службе",
        archive: m.archive || "",
        fund: m.fund || "",
        opis: m.opis || "",
        delo: m.delo || "",
        list: m.list || "",
        transcription: m.wounds || "",
        pages: m.pages || [],
      },
    ];
  }
  return out;
}

/** Дополняет запись из старой базы недостающими полями. */
export function normalizePerson(raw: Partial<Person>): Person {
  const base: Person = {
    ...mkPerson(),
    ...raw,
    military: { ...mkMilitary(), ...(raw.military ?? {}) },
    educations: raw.educations ?? [],
    educationDocs: raw.educationDocs ?? [],
    jobs: raw.jobs ?? [],
    jobDocs: raw.jobDocs ?? [],
    militaryPlaces: raw.militaryPlaces ?? [],
    militaryConflicts: raw.militaryConflicts ?? [],
    militaryAwards: raw.militaryAwards ?? [],
    militaryDocs: raw.militaryDocs ?? [],
    albums: (raw.albums ?? []).map((a) => ({ ...mkAlbum(), ...a, photos: a.photos ?? [] })),
  };
  return migrateMilitary(base);
}
