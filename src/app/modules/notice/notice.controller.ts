import { Request, Response } from 'express';
import { Notice } from './notice.model';

export const createNotice = async (req: Request, res: Response) => {
  try {
    const { title, description, isActive } = req.body;
    const notice = new Notice({ title, description, isActive });
    await notice.save();
    res.status(201).json(notice);
  } catch (error) {
    res.status(500).json({ message: 'Error creating notice', error });
  }
};

export const getNotices = async (req: Request, res: Response) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.status(200).json(notices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notices', error });
  }
};

export const updateNotice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, isActive } = req.body;

    const updatedNotice = await Notice.findByIdAndUpdate(
      id,
      { title, description, isActive, updatedAt: Date.now() },
      { new: true },
    );

    if (!updatedNotice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    res.status(200).json(updatedNotice);
  } catch (error) {
    res.status(500).json({ message: 'Error updating notice', error });
  }
};

export const deleteNotice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedNotice = await Notice.findByIdAndDelete(id);

    if (!deletedNotice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    res.status(200).json({ message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notice', error });
  }
};

export const toggleNoticeStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const notice = await Notice.findById(id);

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    notice.isActive = !notice.isActive;
    notice.updatedAt = new Date();
    await notice.save();

    res.status(200).json(notice);
  } catch (error) {
    res.status(500).json({ message: 'Error toggling notice status', error });
  }
};
