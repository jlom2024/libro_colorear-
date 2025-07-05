
export interface ColoringPage {
  pageTitle: string;
  description: string;
  imagePrompt: string;
  imageUrl?: string;
}

export interface ColoringBook {
  bookTitle: string;
  pages: ColoringPage[];
}
