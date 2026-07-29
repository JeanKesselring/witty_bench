import type { Metadata } from 'next'
import { ImageFilterGallery } from './ImageFilterGallery'

export const metadata: Metadata = {
  title: 'Image Filters — Common Sage',
  description:
    'Twenty-five artistic transformations of a fluorescence cell micrograph.',
}

export default function FiltersPage() {
  return <ImageFilterGallery />
}
